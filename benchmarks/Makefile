all: export NODE_ENV = test
all:
	@echo
	@echo " koa-style middleware"

	@./run es6 1
	@./run es6 5
	@./run es6 10
	@./run es6 15
	@./run es6 20
	@./run es6 30
	@./run es6 50
	@./run es6 100

	@echo
	@echo " express-style middleware"

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