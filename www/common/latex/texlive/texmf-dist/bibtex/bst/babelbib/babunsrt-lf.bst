%%
%% This is file `babunsrt-lf.bst',
%% generated with the docstrip utility.
%%
%% The original source files were:
%%
%% babelbib.dtx  (with options: `bst,bststd,bstunsorted,namevarb')
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
        s nameptr "{ll}" format.name$ lastnamefont
        s nameptr "{,~jj}{, ff{\btxfnamespacelong }}{~vv}" format.name$ *
        't :=
          namesleft #1 >
            { ", " * t namefont * }
            { numnames #2 >
                { "\btxandcomma {}" * }
                'skip$
              if$
              s nameptr "{ff~}{vv~}{ll}{, jj}" format.name$ "others" =
                { " " "\btxetalshort {.}" etalfont * * }
                { " \btxandlong {}\ " * t namefont * }
              if$
            }
          if$
        }
        {
          s nameptr "{ll}" format.name$ lastnamefont
          s nameptr "{,~jj}{, ff{\btxfnamespacelong }}{~vv}"
          format.name$ * namefont
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
        { "\ (\btxeditorslong {})" * }
        { "\ (\btxeditorlong {})" * }
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
          month * "}{" * year * "}{long}" *
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
        { "\Btxvolumelong {}" }
        { "\btxvolumelong {}" }
      if$
      volume volume.tie.or.space.connect
      series empty$
        'skip$
        { " \btxofserieslong {}\ " * series titlefont * }
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
            { "\btxnumberlong {}" }
            { "\Btxnumberlong {}" }
          if$
          number tie.or.space.connect
          series empty$
            { "there's a number but no series in " cite$ * warning$ }
            { " \btxinserieslong {}\ " * series titlefont * }
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
      "\btxeditionnumlong {" swap$ *
      "}{}" *
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
        { "\btxpageslong {}" pages n.dashify tie.or.space.connect }
        { "\btxpagelong {}" pages tie.or.space.connect }
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
        { "\btxchapterlong {}" }
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
        { "\Btxinlong {}\ " booktitle titlefont * }
        { "\Btxinlong {}\ " format.editors * ": " * booktitle titlefont * }
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
      { "\btxtechreplong {}" }
      { type "t" language.change.case }
    if$
  }
  {
    type empty$
      { "\Btxtechreplong {}" }
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
        { "\Btxinlong {}\ " journal titlefont * }
      if$
    }
    { "\Btxinlong {}\ " key titlefont * }
  if$
  " \cite{" * crossref * "}" *
}

FUNCTION {format.crossref.editor}
{
  editor #1 "{ll}{,~jj}{, ff}{~vv}" format.name$ namefont
  editor num.names$ duplicate$
  #2 >
    { pop$ " " "\btxetalshort {.}" etalfont * * }
    { #2 <
        'skip$
        { editor #2 "{ff }{vv }{ll}{ jj}" format.name$ "others" =
            { " " "\btxetalshort {.}" etalfont * * }
            { " \btxandlong {}\ " * editor #2 "{ff}{~vv}{~ll}{, jj}"
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
      "\Btxinlong {}\ "
    }
    { "\Btxvolumelong {}" volume volume.tie.or.space.connect
      " \btxofserieslong {}\ " *
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
            { "\Btxinlong {}\ " booktitle titlefont * }
          if$
        }
        { "\Btxinlong {}\ " key titlefont * }
      if$
    }
    { "\Btxinlong {}\ " format.crossref.editor * }
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
MACRO {acmcs} {"ACM Computing Surveys"}
MACRO {acta} {"Acta Informatica"}
MACRO {cacm} {"Communications of the ACM"}
MACRO {ibmjrd} {"IBM Journal of Research and Development"}
MACRO {ibmsj} {"IBM Systems Journal"}
MACRO {ieeese} {"IEEE Transactions on Software Engineering"}
MACRO {ieeetc} {"IEEE Transactions on Computers"}
MACRO {ieeetcad}
 {"IEEE Transactions on Computer-Aided Design of Integrated Circuits"}
MACRO {ipl} {"Information Processing Letters"}
MACRO {jacm} {"Journal of the ACM"}
MACRO {jcss} {"Journal of Computer and System Sciences"}
MACRO {scp} {"Science of Computer Programming"}
MACRO {sicomp} {"SIAM Journal on Computing"}
MACRO {tocs} {"ACM Transactions on Computer Systems"}
MACRO {tods} {"ACM Transactions on Database Systems"}
MACRO {tog} {"ACM Transactions on Graphics"}
MACRO {toms} {"ACM Transactions on Mathematical Software"}
MACRO {toois} {"ACM Transactions on Office Information Systems"}
MACRO {toplas} {"ACM Transactions on Programming Languages and Systems"}
MACRO {tcs} {"Theoretical Computer Science"}

READ

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

