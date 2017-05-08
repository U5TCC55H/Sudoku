#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <wait.h>
#include <unistd.h>
#include <time.h>

int fd[2]; // to save pipe

char arr[128]; // store some numbers to generate from
char str[128]; // store a complete sudoku, filled by sudoku_gen

int num;

void call_solver(const char *problem, char *buf) {
    int pid = fork();

    if (pid < 0) exit(-1);
    if (pid != 0) { // parent
        if (write(fd[1], problem, 128) == -1) {
            exit(-1);
        }
        wait(NULL);
        read(fd[0], buf, 128);
    } else { // child
        // change the stdio
        dup2(fd[0], 0);
        dup2(fd[1], 1);

        execve("cgi-bin/sudoku_solve", NULL, NULL);
        printf("Error: not found\n");
        exit(-1);
    }
}

int emp_cells[82];
int top = 0;
char problem[128];

int select_cell(int pos) {
    int cur, tmp;
    do {
        switch (rand()%4) {
            case 0: // dig in the same row
                cur = pos/9*9 + rand()%9;
                break;
            case 1: // dig in the same col
                cur = rand()%9*9 + pos%9;
                break;
            case 2: // dig in the same grid
                tmp = rand()%9;
                cur = (pos/9/3*3+tmp/3)*9+pos%9/3*3+tmp%3;
                break;
            default:
                cur = rand()%81;
        }
    } while(problem[cur] == '0');
    return cur;
}

int dig(int cnt) {
    if (cnt == num) return 1;

    if (top > 0) {
        // find an empty cell
        int pos = emp_cells[rand()%top];

        int trial = 1;
        do { // select a related cell, try solving
            trial++;

            int cur = select_cell(pos);
            emp_cells[top++] = cur;
            int tmp = problem[cur];
            problem[cur] = '0';
            call_solver(problem, arr);
            if (arr[0] == 'O' && dig(cnt+1)) return 1; // valid sudoku generated
            problem[cur] = tmp;
            top--;
        } while (trial <= 4); // try at most 4 times, if a valid sudoku is generated, return 1
        // else recover
        return 0;
    } else {
        emp_cells[top++] = rand()%81;
        problem[emp_cells[0]] = '0';

        // loop until a suduku is generated
        while (dig(cnt+1) != 1);
        return 1;
    }
}

int main() {
    srand(time(NULL));

    scanf("%d", &num);

    if (pipe(fd) != 0) {
        return -1;
    }

    do {
        memset(arr, '0', 82);
        // randomly generate some numbers, see if there is solution
        for (int i = 0; i < 9; ++i) {
            arr[rand() % 81] = (rand() % 10) + '0';
        }

        call_solver(arr, str);
    } while (str[0] == 'N'); // while no solution

    // randomly remove
    strcpy(problem, str+1);
    dig(0);

    problem[81] = '\0';
    printf("%s\n", problem);

    return 0;
}
