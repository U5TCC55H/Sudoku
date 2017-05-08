import qualified Network.Socket as Ns
import qualified Control.Concurrent as Concurrent
import qualified Data.ByteString as BS
import System.IO
import System.Process
import System.Exit
import qualified System.Posix.Signals as Signals
import qualified System.Posix.IO

-- create socket, listen to it
-- fork to process every connection
main :: IO ()
main = do
    sock <- Ns.socket Ns.AF_INET Ns.Stream Ns.defaultProtocol   -- create a socket to listen on
    Ns.bind sock 
            (Ns.SockAddrInet 
                61234
                (Ns.tupleToHostAddress (0, 0, 0, 0)))   -- accept connection from any addr
    Ns.listen sock 10    -- at most 10 in backlog

    hClose stderr   -- forbid error output

    -- set sigINT handler to make sure socket is closed when exit
    let sigINTHandler = do 
        Ns.close sock
        putStrLn ":: ctrl+c(sigINT) caught, exit"
        exitSuccess
    Signals.installHandler Signals.sigINT (Signals.Catch sigINTHandler) Nothing

    putStrLn ":: server at port 61234"
    mainloop sock

    where
        mainloop :: Ns.Socket -> IO ()
        mainloop sock = do
            (newSock, (Ns.SockAddrInet _ newAddr)) <- Ns.accept sock
            putStrLn (":: one request from " ++ (show $ Ns.hostAddressToTuple newAddr))
            handle <- Ns.socketToHandle newSock ReadWriteMode
            Concurrent.forkIO $ procRequest handle
            mainloop sock

-- process the request
procRequest :: Handle -> IO ()
procRequest handle = do
    hSetBuffering handle LineBuffering
    line <- hGetLine handle
    let (meth:uri:version:_) = words line
    -- process req and generate resp
    (stat, header, content) <- (case meth of
                                    "GET" -> procMethGET uri handle
                                    "POST" -> procMethPOST uri handle
                                    _ -> procMethUNK uri handle)
    -- send resp
    hPutStrLn handle (version ++ " " ++ stat ++ " " ++ (statToReason stat) ++ "\r")
    if (header /= "") then hPutStrLn handle (header ++ "\r") else return ()
    hPutStrLn handle ("\r")
    hPutStrLn handle (content ++ "\r")
    -- close
    hClose handle
    where
        statToReason :: String -> String
        statToReason ('2':_) = "OK"
        statToReason ('4':_) = "Not Found"
        statToReason ('5':_) = "Server Error"

-- functions to process specific request
procMethGET :: String -> Handle -> IO (String, String, String)
procMethGET uri handle
    | uri == "/" || uri == "/index.html" = do
        content <- readFile "html/index.html"
        return ("200", "", content)

    | take 11 uri == "/new_sudoku" = do
        content <- readCreateProcess (shell ("cgi-bin/sudoku_gen")) (drop 12 uri)
        return ("200", "", content)
    
    | take 11 uri == "/get_answer" = do
        content <- readCreateProcess (shell ("cgi-bin/sudoku_solve")) (drop 12 uri)
        return ("200", "", content)

    | uri == "/about.html" = do
        content <- readFile "html/about.html"
        return ("200", "", content)

    | otherwise = do
        content <- readFile "html/not_found.html"
        return ("404", "", content)

procMethPOST :: String -> Handle -> IO (String, String, String)
procMethPOST uri handle = do 
    return ("404", "", "")

procMethUNK :: String -> Handle -> IO (String, String, String)
procMethUNK uri handle = do
    return ("404", "", "")

