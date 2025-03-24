package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"

	"code.google.com/p/go.crypto/nacl/secretbox"
)

func main() {
	var rs [768][4][]byte
	for i := range rs {
		var k [32]byte
		var n [24]byte
		if _, err := io.ReadFull(rand.Reader, k[:]); err != nil {
			panic(err)
		}
		if _, err := io.ReadFull(rand.Reader, n[:]); err != nil {
			panic(err)
		}
		m := make([]byte, i)
		if _, err := io.ReadFull(rand.Reader, m[:]); err != nil {
			panic(err)
		}
		b := secretbox.Seal(nil, m, &n, &k)
		rs[i][0] = k[:]
		rs[i][1] = n[:]
		rs[i][2] = m
		rs[i][3] = b
	}
	out, err := json.MarshalIndent(rs, "", "")
	if err != nil {
		panic(err)
	}
	fmt.Print("module.exports = ");
	fmt.Print(string(out))
	fmt.Println(";")
}
