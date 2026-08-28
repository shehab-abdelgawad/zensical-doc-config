---
status: new
---

# Templates

## Below are templates it speed up your documentation process

### Code Snippets

#### Python

```py linenums="1"
def bubble_sort(items):
    for i in range(len(items)):
        for j in range(len(items) - 1 - i):
            if items[j] > items[j + 1]:
                items[j], items[j + 1] = items[j + 1], items[j]
```

```py
def bubble_sort(items):
    for i in range(len(items)):
        for j in range(len(items) - 1 - i):
            if items[j] > items[j + 1]:
                items[j], items[j + 1] = items[j + 1], items[j]
```

#### C++

```cpp
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
```

#### Bash

```bash
echo "Hello world"
ssh $USER@localhost
```

### Tables

| Method   | Description                          |
| -------- | ------------------------------------ |
| `GET`    | :lucide-check: Fetch resource        |
| `PUT`    | :lucide-check-check: Update resource |
| `DELETE` | :lucide-x: Delete resource           |

Without emojis

| Method   | Description      |
| -------- | ------------     |
| `Cost`   |  100.$           |
| `Revenue`|  200 %           |
| `Profit` |  0.24            |

### Tabed Content

#### General Tabs

=== "Unordered list"

    * Sed sagittis eleifend rutrum
    * Donec vitae suscipit est
    * Nulla tempor lobortis orci

=== "Ordered list"

    1. Sed sagittis eleifend rutrum
    2. Donec vitae suscipit est
    3. Nulla tempor lobortis orci

#### Code Tabs

=== "Python"

    ``` py
    print("Hello world 1 !")
    ```

=== "C++"

    ``` c++
    #include <iostream>

    int main(void) {
      std::cout << "Hello world 1 !" << std::endl;
      return 0;
    }
    ```

Another Block, note they are linked

=== "Python"

    ``` py
    print("Hello world 2 !")
    ```

=== "C++"

    ``` c++
    #include <iostream>

    int main(void) {
      std::cout << "Hello world 2 !" << std::endl;
      return 0;
    }
    ```

### Math

#### Stand Alone Eq

$$
\cos x=\sum_{k=0}^{\infty}\frac{(-1)^k}{(2k)!}x^{2k}
$$

#### Inline eq

The homomorphism $f$ is injective if and only if its kernel is only the
singleton set $e_G$, because otherwise $\exists a,b\in G$ with $a\neq b$ such
that $f(a)=f(b)$.

### Footnotes

This is a dummy foot note [^1] This is the second dummy footnote.[^2]

[^1]:
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.

[^2]:
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et euismod
    nulla. Curabitur feugiat, tortor non consequat finibus, justo purus auctor
    massa, nec semper lorem quam in massa.

### Images

![Image title](https://dummyimage.com/6000x4000/f5f5f5/aaaaaa)
![Image title](https://dummyimage.com/600x400/21222c/d5d7e2)

### Lists

#### Unorderd

* A
    * a
    * b
    * c
* B

#### Numbered lists

1. A
    1. a
    1. b
    1. c
1. B

#### Task List

* [x] Lorem ipsum dolor sit amet, consectetur adipiscing elit

* [ ] Vestibulum convallis sit amet nisi a tincidunt
    * [x] In hac habitasse platea dictumst
    * [x] In scelerisque nibh non dolor mollis congue sed et metus
    * [ ] Praesent sed risus massa
* [ ] Aenean pretium efficitur erat, donec pharetra, ligula non scelerisque

### Highlights

Nested Admonition

!!! success "Outer Note"

    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et euismod
    nulla. Curabitur feugiat, tortor non consequat finibus, justo purus auctor
    massa, nec semper lorem quam in massa.

    ??? note "Inner Note (collapsable via ???)"

        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et euismod
        nulla. Curabitur feugiat, tortor non consequat finibus, justo purus auctor
        massa, nec semper lorem quam in massa.

!!! Note
    This is a note

!!! Abstract
    This is an abstract

!!! info
    This is an info

!!! tip
    This is an tip

!!! success
    This is an success

!!! question
    This is an question

!!! warning
    This is an warning

!!! failure
    This is a failure

!!! danger
    This is an danger

!!! bug
    This is an bug

!!! example
    This is an example

!!! Quote
    This is an Quote
