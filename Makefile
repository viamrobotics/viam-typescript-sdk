BUF_BIN="`pwd`/bin"
NPM_BIN="`pwd`/node_modules/.bin"
PATH_WITH_TOOLS="${BUF_BIN}:${NPM_BIN}:${PATH}"

install:
	npm ci --audit=false

lint: install
	npm run lint
	npm run typecheck
	npm run check

install-buf:
	./etc/install_buf.sh

buf: install install-buf
	PATH=$(PATH_WITH_TOOLS) buf generate buf.build/googleapis/googleapis
	PATH=$(PATH_WITH_TOOLS) buf generate buf.build/viamrobotics/api --path common,component,robot,service
	PATH=$(PATH_WITH_TOOLS) buf generate buf.build/erdaniels/gostream
	PATH=$(PATH_WITH_TOOLS) buf generate buf.build/viamrobotics/goutils
	cat etc/rollup_files.txt | xargs -n1 -P32 npm run rollup

build: buf
	NODE_OPTIONS="--max-old-space-size=16384" npm run build
