package main

import (
	"crypto/rand"
	"crypto/sha512"
	"encoding/json"
	"fmt"
	"io"
)

func main() {
	var rs [1070][2][]byte
	for i := range rs {
		m := make([]byte, i)
		if _, err := io.ReadFull(rand.Reader, m[:]); err != nil {
			panic(err)
		}
		h := sha512.Sum512(m)
		rs[i][0] = m
		rs[i][1] = h[:]
	}
	out, err := json.MarshalIndent(rs, "", "")
	if err != nil {
		panic(err)
	}
	fmt.Print("module.exports = ")
	fmt.Print(string(out))
	fmt.Println(";")
}
