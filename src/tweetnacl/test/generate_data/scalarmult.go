package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"

	"code.google.com/p/go.crypto/curve25519"
	"code.google.com/p/go.crypto/nacl/box"
)

func main() {
	var rs [256][5][]byte
	for i := range rs {
		pk1, sk1, err := box.GenerateKey(rand.Reader)
		if err != nil {
			panic(err)
		}
		pk2, sk2, err := box.GenerateKey(rand.Reader)
		if err != nil {
			panic(err)
		}
		var out1, out2 [32]byte
		curve25519.ScalarMult(&out1, sk1, pk2)
		curve25519.ScalarMult(&out2, sk2, pk1)
		if out1 != out2 {
			panic("differ")
		}
		rs[i][0] = pk1[:]
		rs[i][1] = sk1[:]
		rs[i][2] = pk2[:]
		rs[i][3] = sk2[:]
		rs[i][4] = out1[:]
	}
	out, err := json.MarshalIndent(rs, "", "")
	if err != nil {
		panic(err)
	}
	fmt.Print("module.exports = ")
	fmt.Print(string(out))
	fmt.Println(";")
}
