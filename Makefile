PATH_WITH_TOOLS="`pwd`/node_modules/.bin:${PATH}"

install:
	npm ci --audit=false --legacy-peer-deps

lint: install
	npm run lint
	npm run typecheck
	npm run check

build: install
	NODE_OPTIONS="--max-old-space-size=16384" npm run build

buf:
	PATH=$(PATH_WITH_TOOLS) buf generate buf.build/googleapis/googleapis
	PATH=$(PATH_WITH_TOOLS) buf generate buf.build/viamrobotics/api --path common,component,robot,service
	PATH=$(PATH_WITH_TOOLS) buf generate buf.build/erdaniels/gostream
	PATH=$(PATH_WITH_TOOLS) buf generate buf.build/viamrobotics/goutils
	cat etc/rollup_files.txt | xargs -n1 -P32 npm run rollup
