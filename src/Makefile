TARGET_PATH = release
CGI_PATH = cgi-bin

all: mkdir $(TARGET_PATH)/$(CGI_PATH)/sudoku_gen $(TARGET_PATH)/$(CGI_PATH)/sudoku_solve $(TARGET_PATH)/sudoku_server $(TARGET_PATH)/html clean

mkdir:
	mkdir -p $(TARGET_PATH)/$(CGI_PATH)
	rm -rf $(TARGET_PATH)/html

$(TARGET_PATH)/sudoku_server: sudoku_server.hs
	ghc -O3 -o $@ $^ 

$(TARGET_PATH)/$(CGI_PATH)/sudoku_solve: sudoku_solve.c
	gcc -O3 -o $@ $^

$(TARGET_PATH)/$(CGI_PATH)/sudoku_gen: sudoku_gen.c
	gcc -O3 -o $@ $^

$(TARGET_PATH)/html: html
	cp -r $^ $@

clean:
	rm -f *.hi *.o
