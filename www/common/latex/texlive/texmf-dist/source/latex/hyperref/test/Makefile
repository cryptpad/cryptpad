all:
	pdflatex test7
	pdflatex test7
	(for i in test*.tex; do pdflatex $$i;pdflatex $$i; done)

clean:
	-$(RM) test*pdf *.aux *.log *.toc *.lof *.lot *.idx *.ind *.out
