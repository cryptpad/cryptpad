/*
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
	size_t n, have = 0;
	unsigned char *msg = calloc(1, crypto_box_ZEROBYTES);
	if (msg == NULL)
		err(1, NULL);
	have = crypto_box_ZEROBYTES;
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
	unsigned char *sk, *pk, *n, *m, *c;
	size_t mlen, clen;

	if (argc < 2) {
		puts("usage: cbox SK PK NONCE");
		return 1;
	}

	if (strlen(argv[1]) != crypto_box_SECRETKEYBYTES * 2)
		errx(1, "bad SK length");
	sk = decodehex(argv[1]);

	if (strlen(argv[2]) != crypto_box_PUBLICKEYBYTES * 2)
		errx(1, "bad PK length");
	pk = decodehex(argv[2]);

	if (strlen(argv[3]) != crypto_box_NONCEBYTES * 2)
		errx(1, "bad NONCE length");
	n = decodehex(argv[3]);

	mlen = readmsg(&m);
	if ((c = calloc(mlen, 1)) == NULL)
		err(1, NULL);

	crypto_box(c, m, mlen, n, pk, sk);
	c += crypto_box_BOXZEROBYTES;
	clen = mlen - crypto_box_BOXZEROBYTES;

	if (fwrite(c, 1, clen, stdout) != clen)
		err(1, NULL);
	return 0;
}
