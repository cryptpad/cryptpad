README                              2012/04/26

This file describes the directory
  CTAN:macros/latex/contrib/oberdiek/

It contains several packages:
  <package>.dtx: source code
  <package>.pdf: documentation
The PDF file also embeds the source code. Thus it is enough to
download the PDF file, if you want to have the package.
See the section `Installation' how to unpack and install the
package in more detail. Here just short instructions are given:
  1a. Download the DTX source file and the PDF documentation.
  1b. Or skip the DTX source download and extract the embedded
      source file, e.g.:
          pdftk <package>.pdf unpack_files output .
  2.  Unpack the package using docstrip:
          tex <package>.dtx
  3.  Install the files in your preferred TDS (texmf) tree.

Installation is easier, if you want to install all packages:
Just download
  CTAN:install/macros/latex/contrib/oberdiek.tds.zip
and unzip it in your preferred TDS (texmf) tree.

Hint for attachfile2: This package comes with a Perl script pdfatfi.pl
that should be installed somewhere in PATH as `pdfatfi', see also
package documentation.

Hints for users of old PDF viewer software (AR <= 5) that cannot
read PDF-1.5 files. Only the PDF files in oberdiek-tds.zip uses
the compression features of PDF-1.5 to get smaller file sizes.
If you must support older PDF viewers, then use the PDF files in
the CTAN directory that do not use the new compression features.

Other files in the CTAN directory:
* README: This file.
* oberdiek.tex, oberdiek.pdf:
  Table of contents of all packages in the directory.
  It contains the table of contents and the abstract of the packages.
  The name is a convenience to users of the program `texdoc'.

Happy TeXing
  Heiko Oberdiek <heiko.oberdiek at googlemail.com>
