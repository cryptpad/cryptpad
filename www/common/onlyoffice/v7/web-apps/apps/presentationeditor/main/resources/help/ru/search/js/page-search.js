function doSearch(e) {
    if (e.keyCode == 13) {
        document.location.href = '../search/search.html?query=' + document.getElementById('search').value;
    }
}