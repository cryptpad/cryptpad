package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"

	"code.google.com/p/go.crypto/nacl/box"
)

func main() {
	var rs [256][4][]byte
	for i := range rs {
		pk1, _, err := box.GenerateKey(rand.Reader)
		if err != nil {
			panic(err)
		}
		_, sk2, err := box.GenerateKey(rand.Reader)
		if err != nil {
			panic(err)
		}
		var n [24]byte // zero nonce
		m := make([]byte, i)
		if _, err := io.ReadFull(rand.Reader, m[:]); err != nil {
			panic(err)
		}
		b := box.Seal(nil, m, &n, pk1, sk2)
		rs[i][0] = pk1[:]
		rs[i][1] = sk2[:]
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
