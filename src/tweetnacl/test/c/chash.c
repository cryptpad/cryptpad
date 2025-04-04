/*
 * This program sings a message using tweetnacl.c.
 * Written by @dchest. Public domain.
 */
#include <err.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "tweetnacl.h"

size_t
readmsg(unsigned char **out)
{
	unsigned char buf[4096];
	unsigned char *msg = NULL;
	size_t n, have = 0;
	while (!feof(stdin)) {
		n = fread(buf, 1, sizeof(buf), stdin);
		if (n == 0)
			break;
		if ((msg = realloc(msg, have + n)) == NULL)
			err(1, NULL);
		memcpy(&msg[have], buf, n);
		have += n;
	}
	*out = msg;
	return have;
}

void
randombytes(unsigned char *x, long long y)
{
	errx(1, "we don't use randombytes");
}

int
main(int argc, const char **argv)
{
	unsigned char *m, h[crypto_hash_BYTES];
	size_t mlen, i;

	mlen = readmsg(&m);
	crypto_hash(h, m, mlen);
	for (i = 0; i < sizeof(h); i++)
		printf("%02x", h[i]);
	return 0;
}
