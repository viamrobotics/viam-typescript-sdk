buf := ./bin/buf
node_modules := $(shell npm root)

export PATH := $(node_modules)/.bin:$(PATH)

# common targets

.PHONY: all
all: clean build lint test

.PHONY: setup
setup: setup-buf setup-js

.PHONY: teardown
teardown: teardown-buf teardown-js

.PHONY: build
build: build-buf build-js

.PHONY: clean
clean: clean-buf clean-js

.PHONY: test
test: $(node_modules)
	npm run test

.PHONY: lint
lint: $(node_modules)
	npm run lint:prettier
	npm run lint:eslint
	npm run typecheck
	npm run check

.PHONY: format
format: $(node_modules)
	npm run format

# protobuf targets

.PHONY: setup-buf
setup-buf: $(buf)

$(buf):
	./etc/install_buf.sh ./bin

.PHONY: teardown-buf
teardown-buf:
	rm -rf $(buf)

.PHONY: clean-buf
clean-buf:
	rm -rf src/gen

.PHONY: update-buf
update-buf: $(buf)
	$(buf) mod update

.PHONY: build-buf
build-buf: $(buf) $(node_modules) clean-buf
	$(buf) generate buf.build/googleapis/googleapis
	$(buf) generate buf.build/viamrobotics/api --path common,component,robot,service
	$(buf) generate buf.build/erdaniels/gostream
	$(buf) generate buf.build/viamrobotics/goutils

# js targets

.PHONY: setup-js
setup-js: $(node_modules)

$(node_modules): package-lock.json
	npm ci --audit=false

.PHONY: teardown-js
teardown-js:
	rm -rf node_modules

.PHONY: clean-js
clean-js:
	rm -rf dist

.PHONY: build-js
build-js: $(node_modules) clean-js build-buf
	npm run build

# build and create a tarball from a package - useful for local testing,
# inspecting what is included in the final distribution, and local publishing.
.PHONY: pack-js
pack-js: build-js
	npm pack
