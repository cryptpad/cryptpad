package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
)

func main() {
	var rs [128][2]interface{}
	fmt.Print("module.exports = ")
	for i := range rs {
		m := make([]byte, i)
		if _, err := io.ReadFull(rand.Reader, m[:]); err != nil {
			panic(err)
		}
		im := make([]int, len(m))
		for i := range m {
			im[i] = int(m[i])
		}
		rs[i][0] = im
		rs[i][1] = m
	}
	out, err := json.Marshal(rs)
	if err != nil {
		panic(err)
	}
	fmt.Print(string(out))
	fmt.Println(";")
}
