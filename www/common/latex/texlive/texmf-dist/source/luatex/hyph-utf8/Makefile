# Makefile for luatex-hyphen in tex-hyphen/hyph-utf8

NAME = luatex-hyphen
DTX = $(NAME).dtx

# Generated files
COMPILED = $(NAME).pdf
UNPACKED = $(NAME).lua hyphen.cfg

# Installation locations
RUNDIR = ../../../tex/luatex/hyph-utf8
DOCDIR = ../../../doc/luatex/hyph-utf8

# Final files
RUNFILES = $(patsubst %, $(RUNDIR)/%, $(UNPACKED))
DOCFILE = $(DOCDIR)/$(COMPILED)

all: $(RUNFILES) $(DOCFILE)

DO_TEX = tex --interaction=batchmode $< >/dev/null
DO_PDFLATEX = pdflatex --interaction=batchmode $< >/dev/null

$(DOCFILE): $(DTX)
	$(DO_PDFLATEX)
	$(DO_PDFLATEX)
	mv $(COMPILED) $(DOCDIR)

$(RUNFILES): $(DTX)
	$(DO_TEX)
	for file in $(UNPACKED); do mv $$file $(RUNDIR); done

clean: 
	@$(RM) -- *.log *.aux *.toc *.idx *.ind *.ilg

.PHONY: clean
