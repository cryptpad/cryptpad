
@echo off

echo
echo *************************************
echo * Using LaTeX, with pslatex package *
echo *************************************
echo

rem emtex default setup calls this latex2e rather than latex

rem latex2e \AtBeginDocument{\RequirePackage{pslatex}}\input %1 %2 %3 %4 %5 %6
latex \AtBeginDocument{\RequirePackage{pslatex}}\input %1 %2 %3 %4 %5 %6

