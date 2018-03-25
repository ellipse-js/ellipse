all: export NODE_ENV = test
all: header classic async

header:
	@echo " node:" `node -v`
	@echo

async: header
	@echo " async middleware"
	@./run es7 1
	@./run es7 5
	@./run es7 10
	@./run es7 15
	@./run es7 20
	@./run es7 30
	@./run es7 50
	@./run es7 100
	@echo

classic: header
	@echo " middleware"
	@./run js 1
	@./run js 5
	@./run js 10
	@./run js 15
	@./run js 20
	@./run js 30
	@./run js 50
	@./run js 100
	@echo

.PHONY: all
