node_modules := $(shell npm root)
buf := npm exec --offline -- buf

# common targets

.PHONY: all
all: clean build lint test

.PHONY: setup
setup:  $(node_modules)

.PHONY: teardown
teardown:
	rm -rf node_modules

.PHONY: build
build: build-buf build-js

.PHONY: clean
clean: clean-js clean-buf

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

# development dependencies

$(node_modules): package-lock.json
	npm ci --audit=false

# protobuf targets

.PHONY: clean-buf
clean-buf:
	rm -rf src/gen

.PHONY: update-buf
update-buf: $(node_modules)
	$(buf) mod update

.PHONY: build-buf
build-buf: $(node_modules) clean-buf
	$(buf) generate buf.build/googleapis/googleapis
	$(buf) generate buf.build/viamrobotics/api --path common,component,robot,service
	$(buf) generate buf.build/erdaniels/gostream
	$(buf) generate buf.build/viamrobotics/goutils

# js targets

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
