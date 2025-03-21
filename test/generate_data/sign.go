package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"

	"github.com/agl/ed25519"
)

func main() {
	var rs [1024][3][]byte
	for i := range rs {
		_, sk, err := ed25519.GenerateKey(rand.Reader)
		if err != nil {
			panic(err)
		}
		m := make([]byte, i)
		if _, err := io.ReadFull(rand.Reader, m[:]); err != nil {
			panic(err)
		}
		s := ed25519.Sign(sk, m)
		rs[i][0] = sk[:] // already includes pk as sk[32:]
		rs[i][1] = m
		rs[i][2] = s[:]
	}
	out, err := json.MarshalIndent(rs, "", "")
	if err != nil {
		panic(err)
	}
	fmt.Print("module.exports = ")
	fmt.Print(string(out))
	fmt.Println(";")
}
