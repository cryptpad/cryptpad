/*
 * Written by @dchest. Public domain.
 */
#include <err.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "tweetnacl.h"

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
	if (len == 0 || len % 2 != 0)
		errx(1, "bad hex string length");
	if ((r = malloc(len / 2)) == NULL)
		err(1, NULL);
	p = r;
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
	unsigned char *n, *p, q[crypto_scalarmult_BYTES];
	size_t i;

	if (argc < 2) {
		puts("usage: cscalarmult N P");
		return 1;
	}

	if (strlen(argv[1]) != crypto_scalarmult_SCALARBYTES * 2)
		errx(1, "bad N length");
	n = decodehex(argv[1]);

	if (strlen(argv[2]) != crypto_scalarmult_SCALARBYTES * 2)
		errx(1, "bad P length");
	p = decodehex(argv[2]);

	crypto_scalarmult(q, n, p);

	for (i = 0; i < sizeof(q); i++)
		printf("%02x", q[i]);
	return 0;
}
