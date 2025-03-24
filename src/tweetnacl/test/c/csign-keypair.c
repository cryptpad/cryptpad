/*
 * This program generates a sign secret key using tweetnacl.c.
 * Written by @dchest. Public domain.
 */
#include <err.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

#include "tweetnacl.h"

void randombytes(unsigned char *x,unsigned long long xlen) {
	static int fd = -1;
	int i;

	if (fd == -1) {
		for (;;) {
			fd = open("/dev/urandom",O_RDONLY);
			if (fd != -1) break;
			sleep(1);
		}
	}

	while (xlen > 0) {
		if (xlen < 1048576) i = xlen; else i = 1048576;

		i = read(fd,x,i);
		if (i < 1) {
			sleep(1);
			continue;
		}

		x += i;
		xlen -= i;
	}
}

int
main(int argc, const char **argv)
{
	unsigned char pk[crypto_sign_PUBLICKEYBYTES],
		      sk[crypto_sign_SECRETKEYBYTES];
	int i;

	crypto_sign_keypair(pk, sk);
	for (i = 0; i < sizeof(sk); i++)
		printf("%02x", sk[i]);
	return 0;
}
