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
build: build-buf build-js build-docs

.PHONY: clean
clean: clean-js clean-buf clean-docs

.PHONY: test
test: $(node_modules) build-buf
	npm run test

.PHONY: test-watch
test-watch: $(node_modules) build-buf
	npm run test:watch

.PHONY: lint
lint: $(node_modules) build-buf
	npm run lint
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
	# TODO(NEEDS TICKET): remove hardcoded pin and create a sane way to pin protos
	# See this thread for more details: https://viaminc.slack.com/archives/C039G724TKP/p1697119526822429
	$(buf) generate buf.build/viamrobotics/api:2109757288234ffc8248121f60437cdd --path common,component,robot,service,app
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
.PHONY: pack
pack: build
	npm pack

# bump to the next pre-release version on the `next` distribution tag -
# run this command if you need to publish an off-cycle release of the sdk
.PHONY: bump-next-version
bump-next-version:
	npm version --no-git-tag-version prerelease --preid=next

# docs targets

.PHONY: clean-docs
clean-docs:
	rm -rf docs/dist

.PHONY: build-docs
build-docs: clean-docs build-buf
	npm run doc
