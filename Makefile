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

.PHONY: _build
_build: build-js build-docs

.PHONY: build
build: build-buf _build

.PHONY: build-ci
build-ci: _build

.PHONY: clean
clean: clean-js clean-buf clean-docs

.PHONY: _test
_test: npm run test

.PHONY: test
test: $(node_modules) build-buf _test

.PHONY: test-ci
test-ci: _test

.PHONY: test-watch
test-watch: $(node_modules) build-buf
	npm run test:watch

.PHONY: _lint
_lint: 
	npm run lint
	npm run typecheck
	npm run check -- --reject="@bufbuild/protobuf,@connectrpc/connect,@connectrpc/connect-web"

.PHONY: lint
lint: $(node_modules) build-buf _lint

.PHONY: lint-ci
lint-ci: _lint

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

.PHONY: _build-buf
_build-buf: 
	$(buf) generate buf.build/googleapis/googleapis
	$(buf) generate buf.build/viamrobotics/api:$$(cat api_version.lock) --path common,component,robot,service,app,provisioning,tagger,stream
	$(buf) generate buf.build/viamrobotics/goutils
	$(buf) generate buf.build/grpc/grpc --path grpc/reflection/v1/reflection.proto

.PHONY: build-buf
build-buf: $(node_modules) clean-buf _build-buf

.PHONY: build-buf-ci
build-buf-ci: _build-buf

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

# e2e tests

.PHONY: install-playwright
install-playwright:
	cd e2e && npm install
	cd e2e && npx playwright install --with-deps

e2e/bin/viam-server:
	bash e2e/setup.sh

.PHONY: run-e2e-server
run-e2e-server: e2e/bin/viam-server
	e2e/bin/viam-server --config=./e2e/server_config.json

.PHONY: _test-e2e
_test-e2e: e2e/bin/viam-server install-playwright
	cd e2e && npm run e2e:playwright

test-e2e: build _test-e2e

test-e2e-ci: _test-e2e
