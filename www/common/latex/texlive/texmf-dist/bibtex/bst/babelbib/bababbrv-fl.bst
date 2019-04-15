%%
%% This is file `bababbrv-fl.bst',
%% generated with the docstrip utility.
%%
%% The original source files were:
%%
%% babelbib.dtx  (with options: `bst,bststd,bstshort,namevara')
%% 
%%   babelbib package
%% 
%%   Copyright  2003--2012 Harald Harders
%% 
%%   This program can be redistributed and/or modified under the terms
%%   of the LaTeX Project Public License Distributed from CTAN
%%   archives in directory macros/latex/base/lppl.txt; either
%%   version 1 of the License, or any later version.
%% 
%%   harald.harders@gmx.de
%% 
%% 2012/01/03 v1.31  babelbib: multilingual bibliographies (HH)
ENTRY
  { address
    annote
    annotelanguage
    author
    booktitle
    chapter
    edition
    editor
    howpublished
    institution
    isbn
    issn
    journal
    key
    language
    month
    note
    number
    organization
    pages
    publisher
    school
    series
    title
    type
    url
    urldate
    volume
    year
  }
  {}
  { label }

INTEGERS
  { output.state
    before.all
    mid.sentence
    after.sentence
    after.block
    before.title
  }

STRINGS
  { s
    t
    language.state
    change.temp
    isbn.command
  }

FUNCTION {init.state.consts}
{ #0 'before.all :=
  #1 'mid.sentence :=
  #2 'after.sentence :=
  #3 'after.block :=
  #4 'before.title :=
  "nostate" 'language.state :=
}

FUNCTION {not}
{   { #0 }
    { #1 }
  if$
}

FUNCTION {and}
{   'skip$
    { pop$ #0 }
  if$
}

FUNCTION {or}
{   { pop$ #1 }
    'skip$
  if$
}

FUNCTION {language.change.case}
{
  'change.temp :=
  't :=
  "\btxifchangecase {"
  t change.temp change.case$ *
  "}{" *
  t *
  "}" *
}

FUNCTION {output.nonnull}
{ 's :=
  output.state mid.sentence =
    { ", " * write$ }
    { output.state after.block =
        { add.period$ write$
          newline$
          "\newblock " write$
        }
        { output.state before.all =
            'write$
            {
              output.state before.title =
                { "\btxauthorcolon\ " * write$ }
                { add.period$ " " * write$ }
              if$
            }
          if$
        }
      if$
      mid.sentence 'output.state :=
    }
  if$
  s
}

FUNCTION {output}
{ duplicate$ empty$
    'pop$
    'output.nonnull
  if$
}

FUNCTION {output.check}
{ 't :=
  duplicate$ empty$
    { pop$ "empty " t * " in " * cite$ * warning$ }
    'output.nonnull
  if$
}

FUNCTION {output.bibitem}
{ newline$
  language empty$
    {
      language.state "nolanguage" =
        'skip$
        {
          "empty language in " cite$ * warning$
          "\expandafter\btxselectlanguage\expandafter {"
          "\btxfallbacklanguage}" *
          write$ newline$
        }
      if$
      "nolanguage" 'language.state :=
    }
    {
      language.state language =
        'skip$
        {
          "\btxselectlanguage {" language * "}" *
          write$ newline$
        }
      if$
      language 'language.state :=
    }
  if$
  "\bibitem {" write$
  cite$ write$
  "}" write$
  newline$
  ""
  before.all 'output.state :=
}

FUNCTION {output.isbn}
{
  'isbn.command :=
  duplicate$
  empty$
    'pop$
    {
      's :=
      output.state mid.sentence =
        {
          isbn.command * " {, " * write$
          s "}" *
        }
        { output.state after.block =
            {
              add.period$
              write$
              newline$
              "\newblock " write$
              isbn.command " {" * s * ".}" *
            }
            { output.state before.all =
                {
                  write$
                  isbn.command " {" * write$
                  s "}" *
                }
                {
                  output.state before.title =
                    {
                      "\btxauthorcolon\ " * write$
                      isbn.command " {" * write$
                      s "}" *
                    }
                    {
                      add.period$ " " * write$
                      isbn.command " {" * write$
                      s ".}" *
                    }
                  if$
                }
              if$
            }
          if$
          mid.sentence 'output.state :=
        }
      if$
    }
  if$
}

FUNCTION {fin.entry}
{ add.period$
  write$
  newline$
}

FUNCTION {new.block}
{ output.state before.all =
    'skip$
    { after.block 'output.state := }
  if$
}

FUNCTION {new.sentence}
{ output.state after.block =
    'skip$
    { output.state before.all =
        'skip$
        { after.sentence 'output.state := }
      if$
    }
  if$
}

FUNCTION {after.authors}
{ output.state before.all =
    'skip$
    { before.title 'output.state := }
  if$
}

FUNCTION {new.block.checka}
{ empty$
    'skip$
    'new.block
  if$
}

FUNCTION {new.block.checkb}
{ empty$
  swap$ empty$
  and
    'skip$
    'new.block
  if$
}

FUNCTION {new.block.checkc}
{ empty$
  swap$ empty$
  and
    'skip$
    'after.authors
  if$
}

FUNCTION {new.sentence.checka}
{ empty$
    'skip$
    'new.sentence
  if$
}

FUNCTION {new.sentence.checkb}
{ empty$
  swap$ empty$
  and
    'skip$
    'new.sentence
  if$
}

FUNCTION {field.or.null}
{ duplicate$ empty$
    { pop$ "" }
    'skip$
  if$
}

FUNCTION {namefont}
{ duplicate$ empty$
    { pop$ "" }
    { "\btxnamefont {" swap$ * "}" * }
  if$
}

FUNCTION {lastnamefont}
{ duplicate$ empty$
    { pop$ "" }
    { "\btxlastnamefont {" swap$ * "}" * }
  if$
}
FUNCTION {titlefont}
{ duplicate$ empty$
    { pop$ "" }
    { "\btxtitlefont {" swap$ * "}" * }
  if$
}
FUNCTION {jtitlefont}
{ duplicate$ empty$
    { pop$ "" }
    { "\btxjtitlefont {" swap$ * "}" * }
  if$
}
FUNCTION {journalfont}
{ duplicate$ empty$
    { pop$ "" }
    { "\btxjournalfont {" swap$ * "}" * }
  if$
}
FUNCTION {publisherfont}
{ duplicate$ empty$
    { pop$ "" }
    { "\btxpublisherfont {" swap$ * "}" * }
  if$
}
FUNCTION {volumefont}
{ duplicate$ empty$
    { pop$ "" }
    { "\btxvolumefont {" swap$ * "}" * }
  if$
}

FUNCTION {etalfont}
{ duplicate$ empty$
    { pop$ "" }
    { "\btxetalfont {" swap$ * "}" * }
  if$
}

INTEGERS { nameptr namesleft numnames }

FUNCTION {format.names}
{ 's :=
  #1 'nameptr :=
  s num.names$ 'numnames :=
  numnames 'namesleft :=
    { namesleft #0 > }
    { nameptr #1 >
      {
        s nameptr
        "{f{.\btxfnamespaceshort }.~}{vv~}" format.name$
        s nameptr "{ll}" format.name$ lastnamefont *
        s nameptr "{,~jj}" format.name$ *
        't :=
          namesleft #1 >
            { ", " * t namefont * }
            { numnames #2 >
                { "\btxandcomma {}" * }
                'skip$
              if$
              s nameptr "{ff~}{vv~}{ll}{, jj}" format.name$ "others" =
                { " " "\btxetalshort {.}" etalfont * * }
                { " \btxandshort {.}\ " * t namefont * }
              if$
            }
          if$
        }
        {
          s nameptr "{f{.\btxfnamespaceshort }.~}{vv~}" format.name$
          s nameptr "{ll}" format.name$ lastnamefont *
          s nameptr "{,~jj}" format.name$ * namefont
        }
      if$
      nameptr #1 + 'nameptr :=
      namesleft #1 - 'namesleft :=
    }
  while$
}

FUNCTION {format.authors}
{ author empty$
    { "" }
    { author format.names }
  if$
}

FUNCTION {format.editors}
{ editor empty$
    { "" }
    { editor format.names
      editor num.names$ #1 >
        { "\ (\btxeditorsshort {.})" * }
        { "\ (\btxeditorshort {.})" * }
      if$
    }
  if$
}
FUNCTION {format.title}
{ title empty$
    { "" }
    { title "t" language.change.case titlefont }
  if$
}
FUNCTION {format.jtitle}
{ title empty$
    { "" }
    { title "t" language.change.case jtitlefont }
  if$
}
FUNCTION {n.dashify}
{ 't :=
  ""
    { t empty$ not }
    { t #1 #1 substring$ "-" =
        { t #1 #2 substring$ "--" = not
            { "--" *
              t #2 global.max$ substring$ 't :=
            }
            {   { t #1 #1 substring$ "-" = }
                { "-" *
                  t #2 global.max$ substring$ 't :=
                }
              while$
            }
          if$
        }
        { t #1 #1 substring$ *
          t #2 global.max$ substring$ 't :=
        }
      if$
    }
  while$
}

FUNCTION {format.date}
{ year empty$
    { month empty$
        { "" }
        { "there's a month but no year in " cite$ * warning$
          month
        }
      if$
    }
    { month empty$
        'year
        { "\btxprintmonthyear{.}{"
          month * "}{" * year * "}{short}" *
        }
      if$
    }
  if$
}

FUNCTION {format.btitle}
{ title titlefont
}

FUNCTION {tie.or.space.connect}
{ duplicate$ text.length$ #3 <
    { "~" }
    { "\ " }
  if$
  swap$ * *
}

FUNCTION {volume.tie.or.space.connect}
{ duplicate$ text.length$ #3 <
    { "~" }
    { "\ " }
  if$
  swap$ volumefont * *
}

FUNCTION {either.or.check}
{ empty$
    'pop$
    { "can't use both " swap$ * " fields in " * cite$ * warning$ }
  if$
}

FUNCTION {format.bvolume}
{ volume empty$
    { "" }
    { output.state after.block =
        { "\Btxvolumeshort {.}" }
        { "\btxvolumeshort {.}" }
      if$
      volume volume.tie.or.space.connect
      series empty$
        'skip$
        { " \btxofseriesshort {.}\ " * series titlefont * }
      if$
      "volume and number" number either.or.check
    }
  if$
}

FUNCTION {format.number.series}
{ volume empty$
    { number empty$
        { series field.or.null }
        { output.state mid.sentence =
            { "\btxnumbershort {.}" }
            { "\Btxnumbershort {.}" }
          if$
          number tie.or.space.connect
          series empty$
            { "there's a number but no series in " cite$ * warning$ }
            { " \btxinseriesshort {.}\ " * series titlefont * }
          if$
        }
      if$
    }
    { "" }
  if$
}

FUNCTION {format.edition}
{ edition empty$
    { "" }
    {
      output.state mid.sentence =
        { edition "l" change.case$ }
        { edition "t" change.case$ }
      if$
      "\btxeditionnumshort {" swap$ *
      "}{.}" *
    }
  if$
}

FUNCTION {format.isbn}
{ isbn empty$
    { "" }
    { "\mbox{\btxISBN~\btxISBNfont {" isbn * "}}" * }
  if$
}

FUNCTION {format.issn}
{ issn empty$
    { "" }
    { "\mbox{\btxISSN~\btxISSNfont {" issn * "}}" * }
  if$
}
FUNCTION {format.url}
{ url empty$
    { "" }
    {
      urldate empty$
      { "{\latintext \btxurlfont{" url * "}}" * }
      {
        "{\latintext \btxurlfont{" url * "}}\empty " *
        "\btxurldatecomment {\btxkeywordlanguage {\btxurldatefont{" *
          urldate * "}}}" *
      }
      if$
    }
  if$
}
FUNCTION {write.annote}
{ annote empty$
  'skip$
  {
    annotelanguage empty$
    { "\btxkeywordlanguage {" }
    { "{\selectlanguage {" annotelanguage * "}" * }
    if$
    "\btxannotation {" * annote * "}}" *
    write$ newline$
  }
  if$
}
INTEGERS { multiresult }

FUNCTION {multi.page.check}
{ 't :=
  #0 'multiresult :=
    { multiresult not
      t empty$ not
      and
    }
    { t #1 #1 substring$
      duplicate$ "-" =
      swap$ duplicate$ "," =
      swap$ "+" =
      or or
        { #1 'multiresult := }
        { t #2 global.max$ substring$ 't := }
      if$
    }
  while$
  multiresult
}

FUNCTION {format.pages}
{ pages empty$
    { "" }
    { pages multi.page.check
        { "\btxpagesshort {.}" pages n.dashify tie.or.space.connect }
        { "\btxpageshort {.}" pages tie.or.space.connect }
      if$
    }
  if$
}

FUNCTION {format.vol.num.pages}
{ volume field.or.null
  number empty$
    'skip$
    { "(" number * ")" * *
      volume empty$
        { "there's a number but no volume in " cite$ * warning$ }
        'skip$
      if$
    }
  if$
  pages empty$
    'skip$
    { duplicate$ empty$
        { pop$ format.pages }
        { ":" * pages n.dashify * }
      if$
    }
  if$
}

FUNCTION {format.chapter.pages}
{ chapter empty$
    'format.pages
    { type empty$
        { "\btxchaptershort {.}" }
        { type "l" language.change.case }
      if$
      chapter tie.or.space.connect
      pages empty$
        'skip$
        { ", " * format.pages * }
      if$
    }
  if$
}

FUNCTION {format.in.ed.booktitle}
{ booktitle empty$
    { "" }
    { editor empty$
        { "\Btxinshort {.}\ " booktitle titlefont * }
        { "\Btxinshort {.}\ " format.editors * ": " * booktitle titlefont * }
      if$
    }
  if$
}

FUNCTION {empty.misc.check}
{ author empty$ title empty$ howpublished empty$
  month empty$ year empty$ note empty$
  and and and and and
  key empty$ not and
    { "all relevant fields are empty in " cite$ * warning$ }
    'skip$
  if$
}

FUNCTION {format.thesis.type}
{ type empty$
    'skip$
    { pop$
      type "t" language.change.case
    }
  if$
}

FUNCTION {format.tr.number}
{
  number empty$
  {
    type empty$
      { "\btxtechrepshort {.}" }
      { type "t" language.change.case }
    if$
  }
  {
    type empty$
      { "\Btxtechrepshort {.}" }
      { type "t" language.change.case }
    if$
    number tie.or.space.connect
  }
  if$
}

FUNCTION {format.article.crossref}
{ key empty$
    { journal empty$
        { "need key or journal for " cite$ * " to crossref " * crossref *
          warning$
          ""
        }
        { "\Btxinshort {.}\ " journal titlefont * }
      if$
    }
    { "\Btxinshort {.}\ " key titlefont * }
  if$
  " \cite{" * crossref * "}" *
}

FUNCTION {format.crossref.editor}
{
  editor #1 "{ll}{,~jj}{,~f.}{~vv}" format.name$ namefont
  editor num.names$ duplicate$
  #2 >
    { pop$ " " "\btxetalshort {.}" etalfont * * }
    { #2 <
        'skip$
        { editor #2 "{ff }{vv }{ll}{ jj}" format.name$ "others" =
            { " " "\btxetalshort {.}" etalfont * * }
            { " \btxandshort {.}\ " * editor #2 "{vv~}{ll}"
              format.name$ namefont * }
          if$
        }
      if$
    }
  if$
}

FUNCTION {format.book.crossref}
{ volume empty$
    { "empty volume in " cite$ * "'s crossref of " * crossref * warning$
      "\Btxinshort {.}\ "
    }
    { "\Btxvolumeshort {.}" volume volume.tie.or.space.connect
      " \btxofseriesshort {.}\ " *
    }
  if$
  editor empty$
  editor field.or.null author field.or.null =
  or
    { key empty$
        { series empty$
            { "need editor, key, or series for " cite$ * " to crossref " *
              crossref * warning$
              "" *
            }
            { series titlefont * }
          if$
        }
        { key titlefont * }
      if$
    }
    { format.crossref.editor * }
  if$
  " \cite{" * crossref * "}" *
}

FUNCTION {format.incoll.inproc.crossref}
{ editor empty$
  editor field.or.null author field.or.null =
  or
    { key empty$
        { booktitle empty$
            { "need editor, key, or booktitle for " cite$ * " to crossref " *
              crossref * warning$
              ""
            }
            { "\Btxinshort {.}\ " booktitle titlefont * }
          if$
        }
        { "\Btxinshort {.}\ " key titlefont * }
      if$
    }
    { "\Btxinshort {.}\ " format.crossref.editor * }
  if$
  " \cite{" * crossref * "}" *
}

FUNCTION {article}
{ output.bibitem
  format.authors "author" output.check
  after.authors
  format.jtitle "title" output.check
  new.block
  crossref missing$
    { journal
      title missing$
        { titlefont }
        { journalfont }
      if$
      "journal" output.check
      format.vol.num.pages output
      format.date "year" output.check
    }
    { format.article.crossref output.nonnull
      format.pages output
    }
  if$
  format.issn "\ifbtxprintISSN" output.isbn
  new.block
  format.url output
  note output
  fin.entry
  write.annote
}

FUNCTION {book}
{ output.bibitem
  author empty$
    { format.editors "author and editor" output.check }
    { format.authors output.nonnull
      crossref missing$
        { "author and editor" editor either.or.check }
        'skip$
      if$
    }
  if$
  after.authors
  format.btitle "title" output.check
  crossref missing$
    { format.bvolume output
      new.block
      format.number.series output
      new.sentence
      publisher "publisher" output.check publisherfont
      address output
    }
    { new.block
      format.book.crossref output.nonnull
    }
  if$
  format.edition output
  format.date "year" output.check
  format.isbn "\ifbtxprintISBN" output.isbn
  new.block
  format.url output
  note output
  fin.entry
  write.annote
}

FUNCTION {booklet}
{ output.bibitem
  format.authors output
  after.authors
  format.title "title" output.check
  howpublished address new.block.checkb
  howpublished output
  address output
  format.date output
  new.block
  format.url output
  note output
  fin.entry
  write.annote
}

FUNCTION {inbook}
{ output.bibitem
  author empty$
    { format.editors "author and editor" output.check }
    { format.authors output.nonnull
      crossref missing$
        { "author and editor" editor either.or.check }
        'skip$
      if$
    }
  if$
  after.authors
  format.btitle "title" output.check
  crossref missing$
    { format.bvolume output
      format.chapter.pages "chapter and pages" output.check
      new.block
      format.number.series output
      new.sentence
      publisher "publisher" output.check publisherfont
      address output
    }
    { format.chapter.pages "chapter and pages" output.check
      new.block
      format.book.crossref output.nonnull
    }
  if$
  format.edition output
  format.date "year" output.check
  format.isbn "\ifbtxprintISBN" output.isbn
  new.block
  format.url output
  note output
  fin.entry
  write.annote
}

FUNCTION {incollection}
{ output.bibitem
  format.authors "author" output.check
  after.authors
  format.title "title" output.check
  new.block
  crossref missing$
    { format.in.ed.booktitle "booktitle" output.check
      format.bvolume output
      format.number.series output
      format.chapter.pages output
      new.sentence
      publisher "publisher" output.check publisherfont
      address output
      format.edition output
      format.date "year" output.check
    }
    { format.incoll.inproc.crossref output.nonnull
      format.chapter.pages output
    }
  if$
  format.isbn "\ifbtxprintISBN" output.isbn
  new.block
  format.url output
  note output
  fin.entry
  write.annote
}

FUNCTION {inproceedings}
{ output.bibitem
  format.authors "author" output.check
  after.authors
  format.title "title" output.check
  new.block
  crossref missing$
    { format.in.ed.booktitle "booktitle" output.check
      format.bvolume output
      format.number.series output
      format.pages output
      address empty$
        { organization publisher new.sentence.checkb
          organization output
          publisher publisherfont output
          format.date "year" output.check
        }
        { address output.nonnull
          format.date "year" output.check
          new.sentence
          organization output
          publisher publisherfont output
        }
      if$
    }
    { format.incoll.inproc.crossref output.nonnull
      format.pages output
    }
  if$
  format.isbn "\ifbtxprintISBN" output.isbn
  new.block
  format.url output
  note output
  fin.entry
  write.annote
}

FUNCTION {conference} { inproceedings }

FUNCTION {manual}
{ output.bibitem
  author empty$
    { organization empty$
        'skip$
        { organization output.nonnull
          address output
        }
      if$
    }
    { format.authors output.nonnull }
  if$
  after.authors
  format.btitle "title" output.check
  author empty$
    { organization empty$
        { address new.block.checka
          address output
        }
        'skip$
      if$
    }
    { organization address new.block.checkb
      organization output
      address output
    }
  if$
  format.edition output
  format.date output
  format.isbn "\ifbtxprintISBN" output.isbn
  new.block
  format.url output
  note output
  fin.entry
  write.annote
}

FUNCTION {mastersthesis}
{ output.bibitem
  format.authors "author" output.check
  after.authors
  format.title "title" output.check
  new.block
  "\btxmastthesis {}" format.thesis.type output.nonnull
  school "school" output.check
  address output
  format.date "year" output.check
  new.block
  format.url output
  note output
  fin.entry
  write.annote
}

FUNCTION {misc}
{ output.bibitem
  format.authors output
  title howpublished new.block.checkc
  format.title output
  howpublished new.block.checka
  howpublished output
  format.date output
  format.isbn "\ifbtxprintISBN" output.isbn
  new.block
  format.issn "\ifbtxprintISSN" output.isbn
  new.block
  format.url output
  note output
  fin.entry
  write.annote
  empty.misc.check
}

FUNCTION {phdthesis}
{ output.bibitem
  format.authors "author" output.check
  after.authors
  format.btitle "title" output.check
  new.block
  "\btxphdthesis {}" format.thesis.type output.nonnull
  school "school" output.check
  address output
  format.date "year" output.check
  format.isbn "\ifbtxprintISBN" output.isbn
  new.block
  format.url output
  note output
  fin.entry
  write.annote
}

FUNCTION {proceedings}
{ output.bibitem
  editor empty$
    { organization output }
    { format.editors output.nonnull }
  if$
  after.authors
  format.btitle "title" output.check
  format.bvolume output
  format.number.series output
  address empty$
    { editor empty$
        { publisher new.sentence.checka }
        { organization publisher new.sentence.checkb
          organization output
        }
      if$
      publisher publisherfont output
      format.date "year" output.check
    }
    { address output.nonnull
      format.date "year" output.check
      new.sentence
      editor empty$
        'skip$
        { organization output }
      if$
      publisher publisherfont output
    }
  if$
  format.isbn "\ifbtxprintISBN" output.isbn
  new.block
  format.url output
  note output
  fin.entry
  write.annote
}

FUNCTION {techreport}
{ output.bibitem
  format.authors "author" output.check
  after.authors
  format.title "title" output.check
  new.block
  format.tr.number output.nonnull
  institution "institution" output.check
  address output
  format.date "year" output.check
  format.isbn "\ifbtxprintISBN" output.isbn
  new.block
  format.url output
  note output
  fin.entry
  write.annote
}

FUNCTION {unpublished}
{ output.bibitem
  format.authors "author" output.check
  after.authors
  format.title "title" output.check
  new.block
  format.url output
  note "note" output.check
  format.date output
  fin.entry
  write.annote
}

FUNCTION {default.type} { misc }

MACRO {jan} {"1"}
MACRO {feb} {"2"}
MACRO {mar} {"3"}
MACRO {apr} {"4"}
MACRO {may} {"5"}
MACRO {jun} {"6"}
MACRO {jul} {"7"}
MACRO {aug} {"8"}
MACRO {sep} {"9"}
MACRO {oct} {"10"}
MACRO {nov} {"11"}
MACRO {dec} {"12"}
MACRO {acmcs} {"ACM Comput.\ Surv.{}"}
MACRO {acta} {"Acta Inf.{}"}
MACRO {cacm} {"Commun. ACM"}
MACRO {ibmjrd} {"IBM J.~Res.\ Dev.{}"}
MACRO {ibmsj} {"IBM Syst.~J.{}"}
MACRO {ieeese} {"IEEE Trans.\ Softw.\ Eng.{}"}
MACRO {ieeetc} {"IEEE Trans.\ Comput.{}"}
MACRO {ieeetcad}
 {"IEEE Trans.\ Comput.-Aided Design Integrated Circuits"}
MACRO {ipl} {"Inf.\ Process.\ Lett.{}"}
MACRO {jacm} {"J.~ACM"}
MACRO {jcss} {"J.~Comput.\ Syst.\ Sci.{}"}
MACRO {scp} {"Sci.\ Comput.\ Programming"}
MACRO {sicomp} {"SIAM J.~Comput.{}"}
MACRO {tocs} {"ACM Trans.\ Comput.\ Syst.{}"}
MACRO {tods} {"ACM Trans.\ Database Syst.{}"}
MACRO {tog} {"ACM Trans.\ Gr.{}"}
MACRO {toms} {"ACM Trans.\ Math.\ Softw.{}"}
MACRO {toois} {"ACM Trans.\ Office Inf.\ Syst.{}"}
MACRO {toplas} {"ACM Trans.\ Prog.\ Lang.\ Syst.{}"}
MACRO {tcs} {"Theoretical Comput.\ Sci.{}"}

READ

FUNCTION {sortify}
{ purify$
  "l" change.case$
}

INTEGERS { len }

FUNCTION {chop.word}
{ 's :=
  'len :=
  s #1 len substring$ =
    { s len #1 + global.max$ substring$ }
    's
  if$
}

FUNCTION {sort.format.names}
{ 's :=
  #1 'nameptr :=
  ""
  s num.names$ 'numnames :=
  numnames 'namesleft :=
    { namesleft #0 > }
    { nameptr #1 >
        { "   " * }
        'skip$
      if$
      s nameptr "{ll{ }}{  f{ }}{vv{ } }{  jj{ }}" format.name$ 't :=
      nameptr numnames = t "others" = and
        { "et al" * }
        { t sortify * }
      if$
      nameptr #1 + 'nameptr :=
      namesleft #1 - 'namesleft :=
    }
  while$
}

FUNCTION {sort.format.title}
{ 't :=
  "A " #2
    "An " #3
      "The " #4 t chop.word
    chop.word
  chop.word
  sortify
  #1 global.max$ substring$
}

FUNCTION {author.sort}
{ author empty$
    { key empty$
        { "to sort, need author or key in " cite$ * warning$
          ""
        }
        { key sortify }
      if$
    }
    { author sort.format.names }
  if$
}

FUNCTION {author.editor.sort}
{ author empty$
    { editor empty$
        { key empty$
            { "to sort, need author, editor, or key in " cite$ * warning$
              ""
            }
            { key sortify }
          if$
        }
        { editor sort.format.names }
      if$
    }
    { author sort.format.names }
  if$
}

FUNCTION {author.organization.sort}
{ author empty$
    { organization empty$
        { key empty$
            { "to sort, need author, organization, or key in " cite$ * warning$
              ""
            }
            { key sortify }
          if$
        }
        { "The " #4 organization chop.word sortify }
      if$
    }
    { author sort.format.names }
  if$
}

FUNCTION {editor.organization.sort}
{ editor empty$
    { organization empty$
        { key empty$
            { "to sort, need editor, organization, or key in " cite$ * warning$
              ""
            }
            { key sortify }
          if$
        }
        { "The " #4 organization chop.word sortify }
      if$
    }
    { editor sort.format.names }
  if$
}

FUNCTION {presort}
{
  type$ "book" =
  type$ "inbook" =
  or
    'author.editor.sort
    { type$ "proceedings" =
        'editor.organization.sort
        { type$ "manual" =
            'author.organization.sort
            'author.sort
          if$
        }
      if$
    }
  if$
  "    "
  *
  year field.or.null sortify
  *
  "    "
  *
  title field.or.null
  sort.format.title
  *
  #1 entry.max$ substring$
  'sort.key$ :=
}

ITERATE {presort}

SORT

STRINGS { longest.label }

INTEGERS { number.label longest.label.width }

FUNCTION {initialize.longest.label}
{ "" 'longest.label :=
  #1 'number.label :=
  #0 'longest.label.width :=
}

FUNCTION {longest.label.pass}
{ number.label int.to.str$ 'label :=
  number.label #1 + 'number.label :=
  label width$ longest.label.width >
    { label 'longest.label :=
      label width$ 'longest.label.width :=
    }
    'skip$
  if$
}

EXECUTE {initialize.longest.label}

ITERATE {longest.label.pass}

FUNCTION {begin.bib}
{
  preamble$ empty$
    'skip$
    { preamble$ write$ newline$ }
  if$
  "\begin{thebibliography}{"  longest.label  * "}" * write$ newline$
  "  \providebibliographyfont{name}{}%" write$ newline$
  "  \providebibliographyfont{lastname}{}%" write$ newline$
  "  \providebibliographyfont{title}{\emph}%" write$ newline$
  "  \providebibliographyfont{jtitle}{\btxtitlefont}%" write$ newline$
  "  \providebibliographyfont{etal}{\emph}%" write$ newline$
  "  \providebibliographyfont{journal}{}%" write$ newline$
  "  \providebibliographyfont{volume}{}%" write$ newline$
  "  \providebibliographyfont{ISBN}{\MakeUppercase}%" write$ newline$
  "  \providebibliographyfont{ISSN}{\MakeUppercase}%" write$ newline$
  "  \providebibliographyfont{url}{\url}%" write$ newline$
  "  \providebibliographyfont{numeral}{}%" write$ newline$
  "  \expandafter\btxselectlanguage\expandafter {\btxfallbacklanguage}"
  write$ newline$
}

EXECUTE {begin.bib}

EXECUTE {init.state.consts}

ITERATE {call.type$}

FUNCTION {end.bib}
{ newline$
  "\end{thebibliography}" write$ newline$
}

EXECUTE {end.bib}

