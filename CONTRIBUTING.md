# Contributing to SUSE Rancher's Product Documentation

Thank you for your interest in contributing to SUSE Rancher's Product Documentation. You can contribute to the documentation via the standard GitHub pull requests workflow. This document outlines the steps to help you with the process.

## Start by filing an issue

Prior to creating a pull request, it is a good idea to create a GitHub issue on the relavant Documentation respository. 

Please check the README.md file for the list of repositories that contribute content to the SUSE Rancher Product Documenation. If you know the exact document page your PR aims to update then you can find out the relevant GitHub respository from the `Resources` menu (the one next to the search field) in the header.

If you are not sure about the page you intend to update or which repository your issue and/or pull request belongs to then start by filing a issue on the [rancher/product-docs-playbook](https://github.com/rancher/product-docs-playbook) repository. The SUSE Rancher Product Documentation GitHub respositories are  actively maintained by the Documentation teams at SUSE and they will help you identify the right repository your issue/PR should be filed on.


## Creating your first PR

SUSE Rancher Product documentation is written in AsciiDoc format. Make yourself familiar with the AsciiDoc format by reading the [documenation](https://docs.asciidoctor.org/asciidoc/latest/).

It is recommended to create your own fork of the respository that you intend to update to create PRs. 

1. Make sure you have a [GitHub](https://github.com/) account, and that you are signed in.

2. Navigate to the respective SUSE Rancher Product Documentation GitHub repository page in a web browser. For example, if you intend to add to or update SUSE Storage documentation then the respective GitHub respository is https://github.com/rancher/longhorn-product-docs. Click the Fork button in the top-right corner, and select the account you want to use. Refer to the README.md page for the full list of SUSE Rancher Product Documentation repositories.

3. Wait for Github to create your fork and redirect you.

4. Clone the fork you have created in the previous steps to your local machine. To find this URL, click the green Code button and copy the HTTPS URL:

```
git clone https://github.com/<username>/<product-docs-repo>.git
```

5. Change into the directory that contains the repo, and check out the /master branch:

```
cd <product-docs-repo>
git checkout main
```

6. List the current remote branches:

```
git remote -v
```

This command should list two remotes, both marked `origin`, like this:

```
origin  https://github.com/<username>/<product-docs-repo>.git (fetch)
origin  https://github.com/<username>/<product-docs-repo>.git (push)
```

The `origin` remotes are your own fork, and you can do whatever you want here without changing the upstream repository.

7. Add the respective product documenation repo as an upstream:

```
git remote add upstream https://github.com/rancher/<product-docs-repo>.git
```

8. Check:

```
git remote -v
```

This command should now have the same two `origin` remotes as before, plus two more labelled `upstream`, like this:


```
origin  https://github.com/<username>/<product-docs-repo>.git (fetch)
origin  https://github.com/<username>/<product-docs-repo>.git (push)
upstream  https://github.com/rancher/<product-docs-repo>.git (fetch)
upstream  https://github.com/rancher/<product-docs-repo>.git (push)
```

9. Check out your fork’s master branch:

```
git checkout master
```

10. Fetch the branches in the upstream repository:

```
git fetch upstream
```

11. Merge the changes from the upstream master branch, into your fork’s master branch:

```
git merge upstream/master
```

12. Create a new branch for the work you want to do. Make sure you give it an appropriate name, and include your username:

```
git checkout -b update-readme-username
```

13. Add new documentation files or update the existing ones based on what you intend to change. Locally test your changes to ensure they look as expected. Find instructions in the README.md file to learn how to build the SUSE Rancher Product Documentation site using local content.

14. Stage your changes:

```
git add <your_file_name>
```

Repeat this for each file you intend to include in your PR.

15. Commit the staged changes. Please go through the section on signing commit to learn more about signing your commits.

```
git commit --signoff -m "your meaningful commit message"
```

16. Push your change to the remote respository:

```
git push --set-upstream origin update-readme-username
```

17. After your changes are successfully pushed open the GitHub repository page in a web browser. Go to the Pull Requests tab.

18. Select New Pull Request.

19. Select compare across forks.

20. From the head repository drop-down menu, select your fork.

21. From the compare drop-down menu, select your branch.

22. Select Create Pull Request.

23. Add a description for your pull request:

24. Select the Create pull request button.

Congratulations! You have successfully created your pull request.

## Sign Your Commits

A sign-off is a line at the end of the explanation for a commit.
All commits must be signed. Your signature certifies that you wrote the patch
or otherwise have the right to contribute the material. When you sign off you
agree to the following rules
(from [developercertificate.org](https://developercertificate.org/)):

```
Developer Certificate of Origin
Version 1.1

Copyright (C) 2004, 2006 The Linux Foundation and its contributors.
1 Letterman Drive
Suite D4700
San Francisco, CA, 94129

Everyone is permitted to copy and distribute verbatim copies of this
license document, but changing it is not allowed.

Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications, whether created in whole or in part
    by me, under the same open source license (unless I am
    permitted to submit under a different license), as indicated
    in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including all
    personal information I submit with it, including my sign-off) is
    maintained indefinitely and may be redistributed consistent with
    this project or the open source license(s) involved.
```

Then you add a line to every git commit message:

    Signed-off-by: Joe Smith <joe.smith@example.com>

Use your real name (sorry, no pseudonyms or anonymous contributions).

If you set your `user.name` and `user.email` git configs, you can sign your
commit automatically with `git commit -s`.

Note: If your git config information is set properly then viewing the `git log`
information for your commit will look something like this:

```
Author: John Smith <john.smith@example.com>
Date:   Thu Feb 2 11:41:15 2018 -0800

    Update README

    Signed-off-by: John Smith <john.smith@example.com>
```

Notice the `Author` and `Signed-off-by` lines match. If they don't your PR will
be rejected by the automated DCO check.

## Linking Pull Requests with Issues

Pull requests to add or update product documentation should reference the issue they are related to. This will enable issues to serve as a central point of reference for a change. For example, if a pull request fixes or completes an issue the commit or pull request should include:

```md
Closes #123
```

In this case 123 is the corresponding issue number.

## Pull Requests Review

After you file a PR, it will be picked up by one of the Documenation engineers at SUSE. They will provide feedback on your PR and guide you through the required steps to merge your PR. The feedback normally includes but not limited to suggestions to ensure your PR is technically correct and adheres to the SUSE documentation standards.
