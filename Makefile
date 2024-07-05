term:
	zellij --layout term.kdl attach cabinet-app -cf

term-kill:
	zellij delete-session cabinet-app -f

open-browser:
	open http://localhost:8001
