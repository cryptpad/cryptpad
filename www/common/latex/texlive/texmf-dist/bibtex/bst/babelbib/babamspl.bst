%%
%% This is file `babamspl.bst',
%% generated with the docstrip utility.
%%
%% The original source files were:
%%
%% babelbib.dtx  (with options: `bst,bstams')
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
    mrnumber
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
  { label bysame }

INTEGERS { output.state before.all mid.sentence }

FUNCTION {init.state.consts}
{ #0 'before.all :=
  #1 'mid.sentence :=
}

STRINGS { s t language.state change.temp}

FUNCTION {shows}
{ duplicate$ "::::  `" swap$ * "'" * top$
}

FUNCTION {showstack}
{"STACK================================================================"
top$
stack$
"ENDSTACK============================================================="
top$
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

FUNCTION {tie.or.space.connect}
{ duplicate$ text.length$ #3 <
    { "~" }
    { "\ " }
  if$
  swap$ * *
}

FUNCTION {add.space.if.necessary}
{ duplicate$ "" =
    'skip$
    { "\ " * }
  if$
}

FUNCTION {either.or.check}
{ empty$
    'pop$
    { "can't use both " swap$ * " fields in " * cite$ * warning$ }
  if$
}

FUNCTION {output.nonnull}
{ 's :=
  output.state mid.sentence =
    { ", " * write$ }
    { output.state before.all =
      'write$
        { add.period$ " " * write$ }
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

FUNCTION {missing.warning}
{ "missing " swap$ * " in " * cite$ * warning$ }

FUNCTION {output.check}
{ 't :=
  duplicate$ empty$
    { pop$ t missing.warning }
    'output.nonnull
  if$
}

FUNCTION {output.bibitem}
{ newline$
  language empty$
    { "empty language in " cite$ * warning$
      language.state "nolanguage" =
        'skip$
        {
          "\expandafter\btxselectlanguage\expandafter {"
          "\btxfallbacklanguage}" * write$
          newline$
        }
      if$
      "nolanguage" 'language.state :=
    }
    { language.state language =
        'skip$
        { "\btxselectlanguage {" language * "}" * write$
          newline$
        }
      if$
      language 'language.state :=
    }
  if$
  "\bibitem {" cite$ * "}" * write$
  newline$
  ""
  before.all 'output.state :=
}

FUNCTION {output.nonempty.mrnumber}
{ duplicate$ missing$
    { pop$ "" }
    'skip$
  if$
  duplicate$ empty$
    'pop$
    { " \MR{" swap$ * "}" * write$ }
  if$
}

FUNCTION {fin.entry}
{ add.period$
  write$
  mrnumber output.nonempty.mrnumber
  newline$
}

INTEGERS { nameptr namesleft numnames }

FUNCTION {format.language}
{ language empty$
    { "" }
    { "\btxprintamslanguage{\btxlanguagename {" language * "}}" * }
  if$
}

FUNCTION {format.names}
{ 's :=
  #1 'nameptr :=
  s num.names$ 'numnames :=
  numnames 'namesleft :=
    { namesleft #0 > }
    {
      s nameptr "{ff{\btxfnamespacelong }~}{vv~}" format.name$
      s nameptr "{ll}" format.name$ lastnamefont *
      s nameptr "{, jj}" format.name$ * 't :=
      nameptr #1 >
        { namesleft #1 >
            { ", " * t namefont * }
            { numnames #2 >
                { "\btxandcomma {}" * }
                'skip$
              if$
              s nameptr "{ff~}{vv~}{ll}{, jj}" format.name$ "others" =
                { " " * "\btxetalshort {.}" etalfont * }
                { " \btxandlong {} " * t namefont * }
              if$
            }
          if$
        }
        {
          s nameptr "{ff{\btxfnamespacelong }~}{vv~}" format.name$
          s nameptr "{ll}" format.name$ lastnamefont *
          s nameptr "{, jj}" format.name$ * namefont
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
    { bysame "\bysame" =
         {"\bysame"}
         { author format.names }
     if$
    }
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

FUNCTION {format.nonauthor.editors}
{ editor empty$
    { "" }
    { editor format.names
      editor num.names$ #1 >
        { ", \btxeditorsshort {.}" * }
        { ", \btxeditorshort {.}" * }
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

FUNCTION {format.journal.vol.year}
{ journal empty$
    { "journal name" missing.warning ""}
    { journal journalfont }
  if$
  volume empty$
    'skip$
    { " " * volume volumefont * }
  if$
  year empty$
    { "year" missing.warning }
    { " (" * year * ")" * }
  if$
}

FUNCTION {format.number}
{ number empty$
    { "" }
    { "\btxnumbershort {.}~" number * }
  if$
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

FUNCTION {format.bookvolume.series.number}
{ volume empty$
    { "" % Push the empty string as a placeholder in case everything else
         % is empty too.
      series empty$
        'skip$
        { pop$ series } % if series is not empty put in stack
      if$
      number empty$
        'skip$
        { duplicate$ empty$ % if no preceding material,
            'skip$          % do nothing, otherwise
            { ", " * }      % add a comma and space to separate.
          if$
          "\btxnumbershort {.}" number tie.or.space.connect * % add the number information
        }
      if$
    }
    { "\btxvolumeshort {.}" volume tie.or.space.connect % vol. XX
      number empty$
        { series empty$
            'skip$
            { series ", " * swap$ *}    % Series Name, vol. XX
          if$
        }
        { series empty$
            { "can't use both volume and number if series info is missing"
              warning$
              "in BibTeX entry type `" type$ * "'" * top$
            }
            { ", " * series * ", \btxnumbershort {.}" * number tie.or.space.connect }
          if$
        }
      if$
    }
  if$

}  % end of format.bookvolume.series.number

FUNCTION {format.inproc.title.address.editors}
{ booktitle empty$
    { "" }
    { booktitle
      address empty$
        'skip$
        { add.space.if.necessary "(" * address * ")" * }
      if$
      editor empty$
        'skip$
        { add.space.if.necessary "(" * format.nonauthor.editors * ")" * }
      if$
    }
  if$
}

FUNCTION {format.incoll.title.editors}
{ booktitle empty$
    { "" }
    { editor empty$
        { booktitle }
        { booktitle
          add.space.if.necessary "(" * format.nonauthor.editors * ")" *
        }
      if$
    }
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
    { pages n.dashify }
  if$
}

FUNCTION {format.book.pages}
{ pages empty$
    { "" }
    { pages multi.page.check
        { "\btxpagesshort {.}~" pages n.dashify * }
        { "\btxpageshort {.}~" pages * }
      if$
    }
  if$
}

FUNCTION {format.chapter.pages}
{ chapter empty$
    'format.book.pages
    { type empty$
        { "\btxchaptershort {.}~" }
        { type "l" language.change.case " " * }
      if$
      chapter *
      pages empty$
        'skip$
        { ", " * format.book.pages * }
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
{ type empty$
    { "\Btxtechrepshort {.}" }
    'type
  if$
  number empty$
    { "t" language.change.case }
    { number tie.or.space.connect }
  if$
}

FUNCTION {format.article.crossref}
{ key empty$
    { journal empty$
        { "need key or journal for " cite$ * " to crossref " * crossref *
          warning$
          ""
        }
        { "\btxinshort {} " journal journalfont * }
      if$
    }
    { "\btxinshort {} " key * }
  if$
  " \cite{" * crossref * "}" *
}

FUNCTION {format.crossref.editor}
{ editor #1 "{vv~}{ll}" format.name$
  editor num.names$ duplicate$
  #2 >
    { pop$ " \btxetalshort {.}" * }
    { #2 <
        'skip$
        { editor #2 "{ff }{vv }{ll}{ jj}" format.name$ "others" =
            { " \btxetalshort {.}" * }
            { " \btxandlong {} " * editor #2 "{vv~}{ll}" format.name$ * }
          if$
        }
      if$
    }
  if$
}

FUNCTION {format.book.crossref}
{ volume empty$
    { "empty volume in " cite$ * "'s crossref of " * crossref * warning$
      "\btxinserieslong {} "
    }
    { "\btxvolumeshort {.}" volume tie.or.space.connect
      " \btxofserieslong {} " *
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
            { series * }
          if$
        }
        { key * }
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
            { "\btxinlong {} " * booktitle titlefont * }
          if$
        }
        { "\btxinlong {} " key * }
      if$
    }
    { "\btxinlong {} " format.crossref.editor * }
  if$
  " \cite{" * crossref * "}" *
}

FUNCTION {article}
{ output.bibitem
  format.authors "author" output.check
  format.jtitle "title" output.check
  crossref missing$
    { format.journal.vol.year output
      format.number output
      format.pages "pages" output.check
    }
    { format.article.crossref output.nonnull
      format.pages "pages" output.check
    }
  if$
  format.issn output
  format.url output
  format.language *
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
  format.title "title" output.check
  format.edition output
  crossref missing$
    { format.bookvolume.series.number output
      publisher "publisher" output.check publisherfont
      address output
    }
    { format.book.crossref output.nonnull
    }
  if$
  format.date "year" output.check
  format.isbn output
  format.url output
  format.language *
  note output
  fin.entry
  write.annote
}

FUNCTION {booklet}
{ output.bibitem
  format.authors output
  format.title "title" output.check
  howpublished output
  address output
  format.date output
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
  format.title "title" output.check
  format.edition output
  crossref missing$
    { format.bookvolume.series.number output
      format.chapter.pages "chapter and pages" output.check
      publisher "publisher" output.check publisherfont
      address output
    }
    { format.chapter.pages "chapter and pages" output.check
      format.book.crossref output.nonnull
    }
  if$
  format.date "year" output.check
  format.isbn output
  format.url output
  format.language *
  note output
  fin.entry
  write.annote
}

FUNCTION {incollection}
{ output.bibitem
  format.authors "author" output.check
  format.title "title" output.check
  crossref missing$
    { format.incoll.title.editors "booktitle" output.check
      format.bookvolume.series.number output
      publisher "publisher" output.check publisherfont
      address output
      format.edition output
      format.date "year" output.check
    }
    { format.incoll.inproc.crossref output.nonnull
    }
  if$
  note output
  format.book.pages output
  format.isbn output
  format.url output
  format.language *
  fin.entry
  write.annote
}

FUNCTION {inproceedings}
{ output.bibitem
  format.authors "author" output.check
  format.title "title" output.check
  crossref missing$
    { format.inproc.title.address.editors "booktitle" output.check
      format.bookvolume.series.number output
      organization output
      publisher publisherfont output
      format.date "year" output.check
    }
    { format.incoll.inproc.crossref output.nonnull
    }
  if$
  note output
  format.book.pages output
  format.isbn output
  format.url output
  format.language *
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
  format.title "title" output.check
  author empty$
    { organization empty$
        { address output }
        'skip$
      if$
    }
    { organization output
      address output
    }
  if$
  format.edition output
  format.date output
  format.isbn output
  format.url output
  note output
  fin.entry
  write.annote
}

FUNCTION {mastersthesis}
{ output.bibitem
  format.authors "author" output.check
  format.title "title" output.check
  "\btxmastthesis {}" format.thesis.type output.nonnull
  school "school" output.check
  address output
  format.date "year" output.check
  format.url output
  note output
  format.book.pages output
  fin.entry
  write.annote
}

FUNCTION {misc}
{ output.bibitem
  format.authors output
  format.title output
  howpublished output
  format.date output
  format.isbn output
  format.issn output
  format.url output
  note output
  format.book.pages output
  fin.entry
  write.annote
  empty.misc.check
}

FUNCTION {phdthesis}
{ output.bibitem
  format.authors "author" output.check
  format.title "title" output.check
  "\btxphdthesis {}" format.thesis.type output.nonnull
  school "school" output.check
  address output
  format.date "year" output.check
  format.isbn output
  format.url output
  note output
  format.book.pages output
  fin.entry
  write.annote
}

FUNCTION {proceedings}
{ output.bibitem
  editor empty$
    { organization output }
    { format.editors output.nonnull }
  if$
  format.title "title" output.check
  format.bookvolume.series.number output
  address empty$
    { editor empty$
        'skip$
        { organization output }
      if$
      publisher publisherfont output
      format.date "year" output.check
    }
    { address output.nonnull
      editor empty$
        'skip$
        { organization output }
      if$
      publisher publisherfont output
      format.date "year" output.check
    }
  if$
  format.isbn output
  format.url output
  note output
  fin.entry
  write.annote
}

FUNCTION {techreport}
{ output.bibitem
  format.authors "author" output.check
  format.title "title" output.check
  format.tr.number output.nonnull
  institution "institution" output.check
  address output
  format.date "year" output.check
  format.isbn output
  format.url output
  note output
  fin.entry
  write.annote
}

FUNCTION {unpublished}
{ output.bibitem
  format.authors "author" output.check
  format.title "title" output.check
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

READ

FUNCTION {sortify}
{ purify$
  "l" language.change.case
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
      s nameptr "{vv{ } }{ll{ }}{  ff{ }}{  jj{ }}" format.name$ 't :=
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
{ type$ "book" =
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

STRINGS { longest.label prev.author this.author }

INTEGERS { number.label longest.label.width }

FUNCTION {initialize.longest.label}
{ "" 'longest.label :=
  #1 'number.label :=
  #0 'longest.label.width :=
  "abcxyz" 'prev.author :=
  "" 'this.author :=
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
  author empty$
    { editor empty$
      { "" }
      'editor
      if$
    }
    'author
  if$
  'this.author :=
  this.author prev.author =
    { "\bysame" 'bysame := }
    { "" 'bysame :=
      this.author "" =
        { "abcxyz" }
        'this.author
      if$
      'prev.author :=
    }
  if$
}

EXECUTE {initialize.longest.label}

ITERATE {longest.label.pass}

FUNCTION {write.lines}
{ { duplicate$ "." = NOT }
    { write$ newline$ }
  while$
  pop$
}

FUNCTION {begin.bib}
{ preamble$ empty$
    'skip$
    { preamble$ write$ newline$ }
  if$
  "\begin{thebibliography}{" longest.label * "}" * write$ newline$
  "  \providecommand{\bysame}{\leavevmode\hbox to3em{\hrulefill}\thinspace}"
    write$ newline$
  "  \providecommand{\MR}{\relax\ifhmode\unskip\space\fi MR }"
    write$ newline$
  "  % \MRhref is called by the amsart/book/proc definition of \MR."
    write$ newline$
  "  \providecommand{\MRhref}[2]{%" write$ newline$
  "    \href{http://www.ams.org/mathscinet-getitem?mr=#1}{#2}"
    write$ newline$
  "  }" write$ newline$
  "  \providecommand{\href}[2]{#2}" write$ newline$
  "  \providebibliographyfont{name}{}%" write$ newline$
  "  \providebibliographyfont{lastname}{}%" write$ newline$
  "  \providebibliographyfont{title}{\emph}%" write$ newline$
  "  \providebibliographyfont{jtitle}{\btxtitlefont}%" write$ newline$
  "  \providebibliographyfont{etal}{}%" write$ newline$
  "  \providebibliographyfont{journal}{}%" write$ newline$
  "  \providebibliographyfont{volume}{\textbf}%" write$ newline$
  "  \providebibliographyfont{ISBN}{\MakeUppercase}%" write$ newline$
  "  \providebibliographyfont{ISSN}{\MakeUppercase}%" write$ newline$
  "  \providebibliographyfont{url}{\url}%" write$ newline$
  "  \providebibliographyfont{numeral}{}%" write$ newline$
  "  \providecommand\btxprintamslanguage[1]{\ (#1)}" write$ newline$
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

