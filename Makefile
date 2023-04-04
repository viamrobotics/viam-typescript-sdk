export PATH := $(shell npm root)/.bin:$(PATH)

buf := ./bin/buf

# common targets

.PHONY: all
all: clean build lint test

.PHONY: setup
setup: setup-buf setup-dist

.PHONY: teardown
teardown: teardown-buf teardown-dist

.PHONY: build
build: build-buf build-dist

.PHONY: clean
clean: clean-buf clean-dist

.PHONY: test
test:
	npm run test

.PHONY: lint
lint:
	npm run lint:prettier
	npm run lint:eslint
	npm run typecheck
	npm run check

.PHONY: format
format:
	npm run format

# protobuf targets

.PHONY: setup-buf
setup-buf: $(buf)
	./etc/install_buf.sh ./bin

.PHONY: teardown-buf
teardown-buf:
	rm -rf $(buf)

.PHONY: clean-buf
clean-buf:
	rm -rf src/gen

.PHONY: update-buf
update-buf:
	$(buf) mod update

.PHONY: build-buf
build-buf: update-buf
	$(buf) generate buf.build/googleapis/googleapis
	$(buf) generate buf.build/viamrobotics/api --path common,component,robot,service
	$(buf) generate buf.build/erdaniels/gostream
	$(buf) generate buf.build/viamrobotics/goutils

# distributable build targets

.PHONY: setup-dist
setup-dist:
	npm ci --audit=false

.PHONY: teardown-dist
teardown-dist:
	rm -rf node_modules

.PHONY: clean-dist
clean-dist:
	rm -rf dist

# TODO(RSDK-870): try removing the custom `--max-old-space-size` option
# once we migrate to protobuf-es, since that generator should produce
# much smaller javascript bundles.
.PHONY: build-dist
build-dist: build-buf
	NODE_OPTIONS="--max-old-space-size=16384" npm run build

# build and create a tarball from a package - useful for local testing,
# inspecting what is included in the final distribution, and local publishing.
.PHONY: pack-dist
pack-dist: build-dist
	npm pack
