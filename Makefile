BUF_BIN="`pwd`/bin"
BUF_TARGET?=buf.build/viamrobotics/api --path common,component,robot,service
NPM_BIN="`pwd`/node_modules/.bin"
PATH_WITH_TOOLS="${BUF_BIN}:${NPM_BIN}:${PATH}"

clean-dist:
	rm -rf dist

install:
	npm ci --audit=false

test:
	npm run test

lint: install
	npm run format
	npm run lint
	npm run typecheck
	npm run check

buf-clean:
	rm -rf src/gen/


buf-install: buf-clean
	./etc/install_buf.sh $(BUF_BIN)

buf-update:
	PATH=$(PATH_WITH_TOOLS) buf mod update

buf: install buf-install
	PATH=$(PATH_WITH_TOOLS) buf generate buf.build/googleapis/googleapis
	PATH=$(PATH_WITH_TOOLS) buf generate ${BUF_TARGET}
	PATH=$(PATH_WITH_TOOLS) buf generate buf.build/erdaniels/gostream
	PATH=$(PATH_WITH_TOOLS) buf generate buf.build/viamrobotics/goutils
	cat etc/rollup_files.txt | xargs -n1 -P32 npm run rollup

build: clean-dist buf
	# TODO(RSDK-870): try removing the custom `--max-old-space-size` option
	# once we migrate to protobuf-es, since that generator should produce
	# much smaller javascript bundles.
	NODE_OPTIONS="--max-old-space-size=16384" npm run build

# LOCAL DEVELOPMENT HELPERS

# build and create a tarball from a package - useful for local testing,
# inspecting what is included in the final distribution, and local publishing.
pack: build
	npm pack
