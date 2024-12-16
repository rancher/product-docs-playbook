# Antora Playbook for SUSE Rancher Product Docs

The repository is for the Antora playbook, which combines and generates the Product Documentation for SUSE Rancher's portfolio. The playbook combines documentation from the below listed repositories.

[rancher/rancher-product-docs](https://github.com/rancher/rancher-product-docs)

[rancher/harvester-product-docs](https://github.com/rancher/harvester-product-docs)

[rancher/longhorn-product-docs](https://github.com/rancher/longhorn-product-docs)

[rancher/rke2-product-docs](https://github.com/rancher/rke2-product-docs)

[rancher/k3s-product-docs](https://github.com/rancher/k3s-product-docs)

[rancher/neuvector-product-docs](https://github.com/rancher/neuvector-product-docs)

[rancher/turtles-product-docs](https://github.com/rancher/turtles-product-docs)

[rancher/fleet-product-docs](https://github.com/rancher/fleet-product-docs)

[rancher/elemental-product-docs](https://github.com/rancher/elemental-product-docs)

[rancher/kubewarden-product-docs](https://github.com/rancher/kubewarden-product-docs)

[rancher/product-docs-playbook](https://github.com/rancher/product-docs-playbook)

## Build the Documentation site

The repository uses [Antora Playbook](https://docs.antora.org/antora/latest/) to combine and build the AsciiDoc content from multiple GitHub repositories into a static website.

### Prerequisites

#### git

You need git to get the source code of this repository. Run the command below to check whether git is installed on your machine.

```
git --version
```

If you don't have git installed on your machine, download and install it for your operating system from the [git downloads](https://git-scm.com/downloads) page.

#### Node.js

Antora requires an active long term support (LTS) release of Node.js. Run the command below to check if you have Node.js installed, and which version. This command should return an [active Node.js LTS version number](https://nodejs.org/en/about/releases/)

```
node -v
```

If you don't have Node.js installed on your machine, install it, preferably via [nvm](https://github.com/nvm-sh/nvm)

### Clone the Playbook repository

Run the git command to clone this repository.

```
git clone https://github.com/rancher/product-docs-playbook.git
```

This playbook repository uses a [git submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules) to get the custom Antora supplemental files that provide custom GUI theme for the documentation website. Run the command below to get the submodule.

```
git submodule update --init
```

### Install node modules

Open a terminal at the root of the git repository. Run the command below.

```
npm ci
```

### Run Antora to build the static website

Run the command below.

```
npx antora --fetch product-docs-playbook-remote.yml
```

Navigate to the `./build/site` directory and open the index.html file in your browser to view and navigate the documentation site.

### Run Antora to build the static website using the local documentation content

The command provided in the previous section fetches documentation content of the products from thier respective remote GitHub respositories. If you want the playbook to use the documentation content from your local machine instead you can do so with `product-docs-playbook-local.yml`.

Clone all the individual product documentation Github repositories one level above the current playbook repository.

Run the command below to use the `product-docs-playbook-local.yml` file.

```
npx antora --fetch product-docs-playbook-local.yml
```

## How to report issues related to the SUSE Rancher Product Documentation

### If you are a SUSE Rancher Customer

It is recommended to report the issue via. the [SUSE Customer Center](https://scc.suse.com/)

### If you are a SUSE Internal Employee

It is recommended to file a Jira ticket. If you do not have access to Jira then you can file a GitHub ticket on the respective product documentation repository.
