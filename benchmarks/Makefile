all: export NODE_ENV = test
all: header generator classic async

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

generator: header
	@echo " generator middleware"
	@./run es6 1
	@./run es6 5
	@./run es6 10
	@./run es6 15
	@./run es6 20
	@./run es6 30
	@./run es6 50
	@./run es6 100
	@echo

classic: header
	@echo " classic middleware"
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
