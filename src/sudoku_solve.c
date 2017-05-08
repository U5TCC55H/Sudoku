#include <stdio.h>
#include <sys/time.h>

#define MAXID 9*9*4+4*9*9*9

int u[MAXID+1], d[MAXID+1], l[MAXID+1], r[MAXID+1]; // to save the dancing links structure
int top[MAXID+1], cnt[9*9*4+1];

int ans[81];
int ans_seek;

#define MAXLINE 9*9*9
int line_row[MAXLINE+1], line_col[MAXLINE+1], line_num[MAXLINE+1];
void rec_line(int line, int row, int col, int n)
{
    line_row[line] = row;
    line_col[line] = col;
    line_num[line] = n;
}

int get_grid(int row, int col)
{
    return (row-1)/3*3+(col-1)/3+1;
}
void build_line(int id, int row, int col, int n)
{
    // cell
    top[id] = (row-1)*9+col;
    u[id] = u[top[id]];
    d[id] = top[id];
    d[u[top[id]]] = id;
    u[top[id]] = id;
    l[id] = id + 3;
    r[id] = id + 1;
    ++cnt[top[id]];

    // row
    ++id;
    top[id] = 81+(row-1)*9+n;
    u[id] = u[top[id]];
    d[id] = top[id];
    d[u[top[id]]] = id;
    u[top[id]] = id;
    l[id] = id-1;
    r[id] = id+1;
    ++cnt[top[id]];

    // col
    ++id;
    top[id] = 162+(col-1)*9+n;
    u[id] = u[top[id]];
    d[id] = top[id];
    d[u[top[id]]] = id;
    u[top[id]] = id;
    l[id] = id-1;
    r[id] = id+1;
    ++cnt[top[id]];

    // grid of (3*3)
    ++id;
    int g = get_grid(row, col);
    top[id] = 243+(g-1)*9+n;
    u[id] = u[top[id]];
    d[id] = top[id];
    d[u[top[id]]] = id;
    u[top[id]] = id;
    l[id] = id-1;
    r[id] = id-3;
    ++cnt[top[id]];
}

void rmv(int id)
{
    r[l[id]] = r[id];
    l[r[id]] = l[id];
    for (int i = d[id]; i != id; i = d[i]) {
        for (int j = r[i]; j != i; j = r[j]) {
            d[u[j]] = d[j];
            u[d[j]] = u[j];
            --cnt[top[j]];
        }
    }
}

void rst(int id)
{
    r[l[id]] = id;
    l[r[id]] = id;
    for (int i = d[id]; i != id; i = d[i]) {
        for (int j = r[i]; j != i; j = r[j]) {
            d[u[j]] = j;
            u[d[j]] = j;
            ++cnt[top[j]];
        }
    }
}

int solve()
{
    if (r[0] == 0) return 1;

    int cur = r[0];
    int cur_cnt = 0x7fffffff;

    for (int i = r[0]; i != 0; i = r[i]) {
        if (cnt[i] < cur_cnt) {
            cur_cnt = cnt[i];
            cur = i;
        }
    }

    int solved = 0;

    rmv(cur);
    for (int i = d[cur]; i != cur; i = d[i]) {
        ans[ans_seek++] = (i-325)/4 + 1;
        for (int j = r[i]; j != i; j = r[j]) {
            rmv(top[j]);
        }

        int tmp = solve();
        if (tmp == 2) return 2;
        else if (tmp == 1) {
            if (solved == 1) return 2;
            else solved = 1;
        }

        for (int j = l[i]; j != i; j = l[j]) { // restore in reversed order
            rst(top[j]);
        }
        if (solved == 0)
            --ans_seek;
    }
    rst(cur);

    return solved;
}

int anss[10][10];
void extract_answer()
{
    while (ans_seek--) {
        anss[line_row[ans[ans_seek]]][line_col[ans[ans_seek]]] = line_num[ans[ans_seek]];
    }
}

int main()
{
    struct timeval start, end;

    gettimeofday(&start, NULL);

    // construct the 0th row
    for (int i = 0; i <= 324; ++i) {
        l[i] = i-1;
        r[i] = i+1;
        u[i] = d[i] = i;
    }
    l[0] = 324;
    r[324] = 0;

    // read sudoku
    // construct the dancing links
    for (int row = 1, line = 1, id = 325; row <= 9; ++row) {
        for (int col = 1; col <=9; ++col) {
            int num = getchar() - '0';
            if (num == 0) { // create node for 1-9
                for (int n = 1; n <= 9; ++n) {
                    rec_line(line, row, col, n); // record the (r, c, n) tuple of this line
                    build_line(id, row, col, n); // build the links in the line
                    ++line;
                    id += 4;
                }
            } else { // create node for the single num
                rec_line(line, row, col, num);
                build_line(id, row, col, num);
                ++line;
                id += 4;
            }
        }
    }
    
    int judgement = solve();
    if(judgement == 0) {
        putchar('N');
        return 0;
    }

    extract_answer();
 
    gettimeofday(&end, NULL);

    putchar(judgement==1?'O':'M'); // only one answer?
    for (int i = 1; i <= 9; ++i) {
        for (int j = 1; j <= 9; ++j) {
            putchar('0'+anss[i][j]);
        }
    }
    printf("t%d", end.tv_usec - start.tv_usec);
    putchar('\0');

    return 0;
}

