/*
 * This program signs a message using tweetnacl.c.
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

unsigned char
dechexchar(char c)
{
	if (c >= '0' && c <= '9')
		return (c - 0x30);
	else if (c >= 'A' && c <= 'F')
		return (c - 0x37);
	else if (c >= 'a' && c <= 'f')
		return (c - 0x57);
	else
		errx(1, "not a hex char");

}

unsigned char *
decodehex(const char *h)
{
	unsigned char *r, *p, a, b;
	size_t i, len;

	len = strlen(h);
	if ((r = malloc(len / 2)) == NULL)
		err(1, NULL);
	p = r;
	if (len % 2 != 0)
		errx(1, "bad hex string length");
	for (i = 0; i < len; i += 2)
		*p++ = ((dechexchar(h[i]) * 16) & 0xf0) + (dechexchar(h[i+1]) & 0xf);
	return r;
}

void
randombytes(unsigned char *x, long long y)
{
	errx(1, "we don't use randombytes");
}

int
main(int argc, const char **argv)
{
	unsigned char *sk, *m, *sm;
	size_t mlen, n;
	long long unsigned int smlen;

	if (argc < 2) {
		puts("usage: csign PRIVATE_KEY");
		return 1;
	}
	if (strlen(argv[1]) != crypto_sign_SECRETKEYBYTES * 2)
		errx(1, "bad key length");
	sk = decodehex(argv[1]);
	mlen = readmsg(&m);
	if ((sm = calloc(mlen + crypto_sign_BYTES, 1)) == NULL)
		err(1, NULL);

	crypto_sign(sm, &smlen, m, mlen, sk);
	if (fwrite(sm, 1, smlen, stdout) != smlen)
		err(1, NULL);
	return 0;
}
