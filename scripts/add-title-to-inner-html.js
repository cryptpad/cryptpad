var fs = require("fs");

var titles = {
	"sheet": "CryptPad - Sheet",
	"pad": "CryptPad - Rich Text",
	"kanban": "CryptPad - Kanban",
	"code": "CryptPad - Code",
	"form": "CryptPad - Form",
	"diagram": "CryptPad - Diagram",
	"slide": "CryptPad - Markdown Slides",
}

var files = Object.keys(titles).map(function(val) {
	return {path: "./www/" + val + "/inner.html", name: val};
});

files.forEach(function(val) {
	var buf = fs.readFileSync(val.path);
	var str = buf.toString();
	if(str.match("<title>")) {
		return
	}
	
	const data = str.replace(/<head>/, `<head>
    <title>${titles[val.name]}</title>`);
	console.log("Writing to", val.path, "\n", data, "\n");
	// empty the file
	fs.truncateSync(val.path, 0);
	fs.writeFileSync(val.path, data);
})