---
title: What's Test Doubles?
description: Explaining what are tye types of Test Doubles and when each one of them is useful
tags: ["testdoubles", "testing", "tdd", "typescript"]
published: true
---

Have you ever heard of test doubles? Even if you haven't, many software engineers use test doubles. For example, if you use `Mockito` in the Java world or `Vitest/Jest` in the JavaScript world, you are almost certainly using a test double.

Code that mimics a real implementation is called a test double.

There are several types of test doubles. The most commonly known name is the “mock”. Have you ever heard the expression “mocking a function” when talking about testing? In many cases, “mocking” means “making something behave differently from the real thing. But is it really “mocking”? What is the definition of “mock” in the first place? In this article, I will try to answer these questions.

## Types of Test Doubles

There are several ways to classify test doubles, but [following Martin Fowler]((https://martinfowler.com/articles/mocksArentStubs.html)), this article will classify them into the following five types

* **Dummy:** A test double created to pass compilation (it will break if you try to use it).
* **Fake:** A fake that actually works. Usually flawed in some way and not suitable for a production environment (e.g. in-memory database).
* **Stub:** A test double that returns a predetermined value when called.
* **Spy:** A test double that records how it is called.
* **Mock:** A spy that asserts itself.

What do you think? Some of you may be thinking, “This doesn't make sense." I was also confused at first. Please read through the article without worrying about the details. After reading this article, you will be able to “get it”.

## Motivation to classify test doubles

Why classify the test double? I believe it's for “clarify the intent of the test." I often develop by pair programming, and sometimes says to the pair, “Let's create a stub here to fix the behavior." If the partner also understands the classification of the test double, it is easier to convey the intent.

There is also a desire to be “professional” and use the correct terminology; writing JavaScript as JAVA SCRIPT undermines the trust of some people. You may suffer a similar disadvantage by calling a test double a miscellaneous name.

## Test Double to Test the “Rocket Launch” System

Let's consider a test double in a program that controls a “rocket launch” system [^github]. The example is in TypeScript, but it is written in such a way that it can be understood even if you do not have TypeScript-specific knowledge. If you understand the concepts of “interface” and “inheritance,” you can read it.

By the way, this program has a source: a blog post titled “The Test Double Rule of Thumb” published by VMware Tanzu Labs. The blog of Tanzu Labs has been closed for some time now, and it is no longer available. The original article was written in Java and was about controlling the launch of a missile, not a rocket. I pay great respect to the original article.

[^github]: [The final code is available on GitHub](https://github.com/mahata/test-doubles-typescript-sample).

### First State

There are two interfaces: `Rocket` and `LaunchCode`.

Let's start with `Rocket`.

```typescript
export interface Rocket {
  // Launch the rocket
  launch(): void

  // Disable the rocket
  disable(): void
}
```

That's easy. Next is `LaunchCode`. This is the code required to launch the `Rocket`. We can't just launch the rocket without any thought.

```typescript
export interface LaunchCode {
  // Returns whether the launch code has expired
  isExpired(): boolean

  // Returns whether the launch code is signed.
  isSigned(): boolean
}

```

We also created a `Launcher` as the main class and provided a method called `launchRocket()`. For now, this method simply `launch()` the `Rocket` object.

```typescript
export class Launcher {
  launchRocket(rocket: Rocket, launchCode: LaunchCode) {
    this.rocket.launch()
  }
}
```

However, you don't want `launchRocket()` to launch a real rocket in the middle of the implementation. It would be disastrous. So let's consider dummy rockets.

### Dummy

A valid launch code is required to launch a rocket. The launch code becomes invalid when it expires. How can we make sure in a test that an expired launch code will not launch a rocket?

Let's look at my proposal to use a dummy rocket.

```typescript
export class DummyRocket implements Rocket {
  launch() {
    throw Error()
  }

  disable() {}
}
```

Dummy is a test double that “breaks when you actually try to use it”; the test that `launchRocket()` fails when it tries to use `DummyRocket` is as follows:

```typescript
it("When expired launch code is given, rocket is not launched", () => {
  const launcher = new Launcher()
  launcher.launchRocket(new DummyRocket(), new ExpiredLaunchCodeStub())
})
```

`ExpiredLaunchCodeStub` is implemented as follows. This class is a test double called Stub. The definition of a stub is explained later.

```typescript
export class ExpiredLaunchCodeStub implements LaunchCode {
  isSigned() {
    return true
  }

  isExpired() {
    return true
  }
}
```

This test fails, which is not surprising since `dummyRocket` throws an exception when `launched()`.

We now have a “fails if rocket is used” test! Are you satisfied? No. This test has the following problems:

1. The absence of assertions in the test code makes it difficult to understand the intent of the test.
2. Catching the exception allows the test to pass even if `launch()` is used.

Let's assume that launchRocket() is implemented as follows:

```typescript
  launchRocket() {
    try {
      this.rocket.launch()
    } catch (error) {}
  }
```

This passes the test even though it is launching the rocket. This means that the test is not driving the implementation, i.e., it is not functioning as TDD.

To remedy this, Let's introduce Spy.

## Spy

The spy is a “test double that records how it was called." Let's quickly create a spy for Rocket.

```typescript
export class RocketSpy implements Rocket {
  launchWasCalled = false

  launch() {
    this.launchWasCalled = true
  }

  wasLaunchCalled(): boolean {
    return this.launchWasCalled
  }

  disable() {}
}
```

This is a spy: `launch()` will set the `launchWasCalled` flag to true, and calling `wasLaunchCalled()` will get the value of the `launchWasCalled` flag. This implementation fulfills the request to record whether `launch()` is called or not.

Let's rewrite the test code using this. It should look something like this:

```typescript
it("When expired launch code is given, rocket is not launched", () => {
  const rocket = new RocketSpy()

  const launcher = new Launcher()
  launcher.launchRocket(rocket, new ExpiredLaunchCodeStub())

  expect(rocket.wasLaunchCalled()).toBe(false)
})
```


`rocket.wasLaunchCalled()` returns true if the rocket passed to the `launcher.launchRocket()` method has been `launched()`. Now this test fails.

```typescript
  launchRocket() {
    if (!this.launchCode.isExpired()) {
      this.rocket.launch()
    }
  }
```

[^given-when-then]: Martin Fowler has [a blog post on Given When Then syntax](https://martinfowler.com/bliki/GivenWhenThen.html). This syntax conveys the intent of the test by dividing the test code into three sections and writing "Given," "When," and “Then".

It is probably easier to get the intent of the test with spies than with dummies. By using spies, we can write tests that follow the Given-When-Then syntax [^given-when-then]. Let's add a comment to the code we just used with the spy.

```typescript
it("When expired launch code is given, rocket is not launched", () => {
  // Given: When there's a rocket
  const rocket = new RocketSpy()

  // When: Launch the rocket with an expired launch code
  const launcher = new Launcher()
  launcher.launchRocket(rocket, new ExpiredLaunchCodeStub())

  // Then: Rocket is not launched
  expect(rocket.wasLaunchCalled()).toBe(false)
})
```

It's easy to understand. Also, with dummies, I could clench the exception and pass the test incorrectly, but not with spies. I could write a test to drive implementation. We could say that we could do test-driven development 😊

Next, let's look at mocks.

## Mock

A new request came in from a product manager. When an invalid launch code is used, they want to disable the rocket itself as well. The `Rocket` interface had a `disable()` method. We could call this.

Let's modify the test code using the spy from earlier.

```typescript
it("When expired launch code is given, rocket is not launched", () => {
  const rocket = new RocketSpy()

  const launcher = new Launcher()
  launcher.launchRocket(rocket, new ExpiredLaunchCodeStub())

  expect(rocket.wasLaunchCalled()).toBe(false)
  expect(rocket.wasDisableCalled()).toBe(true) // add this line
})
```

Added one assertion [^one-assertion-per-test]. Nothing too difficult. Let's update `RocketSpy` to make this test passed. It should look something like this:

[^one-assertion-per-test]: There is an opinion that there should be only a single assertion for a single test method. I agree with that policy, but ignore it here for simplicity of explanation.

```typescript
export class RocketSpy implements Rocket {
  launchWasCalled = false
  disableWasCalled = false  // add this line

  launch() {
    this.launchWasCalled = true
  }

  wasLaunchCalled(): boolean {
    return this.launchWasCalled
  }

  disable() {
    this.disableWasCalled = true  // add this line
  }

  // add this method
  wasDisableCalled() {
    return this.disableWasCalled
  }
}
```

So far, it's clear.

The product manager says that not only can't we launch a rocket with expired launch code, we can't launch a rocket with unsigned launch code either. Then we need another test case.

```typescript
it("When unsigned launch code is given, rocket is not launched", () => {
  const rocket = new RocketSpy()

  const launcher = new Launcher()
  launcher.launchRocket(rocket, new UnsignedLaunchCodeStub())

  expect(rocket.wasLaunchCalled()).toBe(false)
  expect(rocket.wasDisableCalled()).toBe(true)
})
```

`UnsignedLaunchCodeStub` looks like this, with `isSigned()` returning `false`.

```typescript
export class UnsignedLaunchCodeStub implements LaunchCode {
  isSigned(): boolean {
    return false
  }

  isExpired() {
    return false
  }
}
```

Now consider an implementation that passes these tests. We could only `launch()` a rocket if the launch code is signed, not expired. So the implementation would look like this:

```typescript
  launchRocket() {
    if (!this.launchCode.isExpired() && this.launchCode.isSigned()) {
      this.rocket.launch()
    } else {
      this.rocket.disable()
    }
  }
```

Now all tests pass. If all tests pass, it means it is time to refactor [^red-green-refactor]. Let's look again at the previous two test cases.

[^red-green-refactor]: [Test-driven development is a “Red => Green => Refactor” cycle](https://www.codecademy.com/article/tdd-red-green-refactor), where Red is the state where the test fails, Green is the state where the test passes, and Green is followed by Refactor because you can immediately notice if you accidentally break the implementation during refactoring.

```typescript
it("When expired launch code is given, rocket is not launched", () => {
  const rocket = new RocketSpy()

  const launcher = new Launcher()
  launcher.launchRocket(rocket, new ExpiredLaunchCodeStub())

  expect(rocket.wasLaunchCalled()).toBe(false)
  expect(rocket.wasDisableCalled()).toBe(true)
})

it("When unsigned launch code is given, rocket is not launched", () => {
  const rocket = new RocketSpy()

  const launcher = new Launcher()
  launcher.launchRocket(rocket, new UnsignedLaunchCodeStub())

  expect(rocket.wasLaunchCalled()).toBe(false)
  expect(rocket.wasDisableCalled()).toBe(true)
})
```

They are very similar. In particular, the next two lines are exactly the same:

```typescript
  expect(rocket.wasLaunchCalled()).toBe(false)
  expect(rocket.wasDisableCalled()).toBe(true)
```

To clean up this duplication of assertions, let's make `RocketSpy` itself perform the assertion function by adding the following method to `RocketSpy`:

```typescript
  verifyAbort() {
    expect(this.launchWasCalled).toBe(false)
    expect(this.disableWasCalled).toBe(true)
  }
```

This eliminates duplicate test code. It's clean. But is this really a spy? In fact, to this point, it is more appropriate to call this class a Mock. At the beginning of this article, I described a mock as a Spy that can assert itself. Exactly, the function to assert itself has been implemented.

Are there any disadvantages to using Mocks? Some may think that mocks are less readable than spies. Because explicit assertions fall out of the body of the test. We need to jump to `verifyAbort()` in the IDE to find out what we are asserting.

But if there are more conditions that don't fire rockets, their unrecognizability can't be ignored if the asserts are scattered throughout the test case. With mocks, the assert contents can be gathered in one place, reducing the need to write the same code all over the place.

## Stub

Now let's talk about Stubs. Actually, though, stubs have already appeared: `ExpiredLaunchCodeStub` and `UnsignedLaunchCodeStub`. They fulfill the characteristics of stubs. That is, their methods "always return the same value."

Stubs are the basic test double, and it is almost impossible to write tests without them. That is why I wrote this article without any explanation at the first hand. It is a test double that is also easy to understand. So much so that I think I'll end the explanation here 😛

There is one thing I am dissatisfied with the stub implementation so far, so I will refactor it and conclude this section. The only complaint I have is that it is difficult to understand whether `ExpiredLaunchCodeStub` and `UnsignedLaunchCodeStub` are Expired or Signed, respectively. Let's solve this by introducing a base class.

```typescript
export class ValidLaunchCode implements LaunchCode {
  isSigned() {
    return true
  }

  isExpired() {
    return false
  }
}

export class UnsignedLaunchCodeStub extends ValidLaunchCode {
  isSigned(): boolean {
    return false
  }
}

export class ExpiredLaunchCodeStub extends ValidLaunchCode {
  isExpired() {
    return true
  }
}
```

Introducing the base class `ValidLaunchCode` makes it easier to understand the intent of the derived class stub.

## Fake

The product manager has informed us of another new requirement. He wants the launch code to be usable only once. Once someone has used the launch code, it is no longer available.

The test code would look like this:

```typescript
it("When launch code is used already, rocket is not launched", () => {
  const rocket1 = new RocketMock()
  const rocket2 = new RocketMock()
  const launchCode = new ValidLaunchCode()

  const launcher = new Launcher()
  launcher.launchRocket(rocket1, launchCode)
  launcher.launchRocket(rocket2, launchCode)

  rocket2.verifyAbort()
})
```

What kind of implementation would allow this test to pass? Where should we store the used launchCode: RDBMS, KVS, or something else? Can it be stored in-memory? Do I need disk?

We prefer to make these decisions later. It is better to make these decisions when you have a clearer picture of your requirements. Focus on the interface to be implemented without thinking about the specific backend. Suppose the `launchRocket()` method accepts an argument called `usedLaunchCodes`. We use it as follows:

```typescript
  Launcher.launchRocket(rocket1, launchCode, usedLaunchCodes);
  Launcher.launchRocket(rocket2, launchCode, usedLaunchCodes);
```

The requirements of the product manager should be satisfied if `usedLaunchCodes` can be used in the `launchRocket()` method as follows:

```typescript
  launchRocket(rocket: Rocket, launchCode: LaunchCode, usedLaunchCodes: UsedLaunchCodes) {
    if (
      !usedLaunchCodes.contain(launchCode) &&
      !launchCode.isExpired() &&
      launchCode.isSigned()
    ) {
      rocket.launch()
      usedLaunchCodes.add(launchCode)
    } else {
      rocket.disable()
    }
  }
```

Yes, all we need is `contains()` and `add()` methods for `usedLaunchCodes`. At this point, the `UsedLaunchCodes` interface seems to be defined. And once the interface is defined, we can create a fake class that satisfies it. Yes, that fake is a Fake test double.

Fake is completely different from other test doubles. Other test doubles are easily distinguished from the real thing. Fakes, on the other hand, are made to be indistinguishable from the real thing. The fake imitates all the behaviors of the real thing. The fake is expected to be used in the same way as the real thing. But how do we make sure the fake behaves as expected? We can write tests 😉 When using a fake, we need to test the fake itself. This is another difference from other test-doubles.

Now, the interface of `UsedLaunchCodes` can be expressed in TypeScript code as follows

```typescript
export interface UsedLaunchCodes {
  contain(launchCode: LaunchCode): boolean
  add(launchCode: LaunchCode): void
}
```

What would the test of this implementation class, `FakeUsedLaunchCodes`, look like? I think the test would be as follows:

```typescript
it("contains() checks if a given launch code is already used", () => {
  const usedLaunchCodes = new FakeUsedLaunchCodes()
  const launchCode = new ValidLaunchCode()

  expect(usedLaunchCodes.contain(launchCode)).toBe(false)

  usedLaunchCodes.add(launchCode)

  expect(usedLaunchCodes.contain(launchCode)).toBe(true)
})
```

Now that we have come this far, it should not be too difficult to implement it; my implementation of `FakeUsedlaunchCodes` is as follows:

```typescript
export class FakeUsedLaunchCodes implements UsedLaunchCodes {
  private launchCodes: Set<LaunchCode> = new Set()

  add(launchCode: LaunchCode): void {
    this.launchCodes.add(launchCode)
  }

  contain(launchCode: LaunchCode): boolean {
    return this.launchCodes.has(launchCode)
  }
}
```

Is this implementation acceptable? This way, if you restart the process, you lose the history of used launch codes. But the faking is "Ok with it." Implementing it this way allows us to put off making decisions about the real `UsedLaunchCodes` backend. Right now the in-memory `Set<LaunchCode>` is the history of the launch code, but a real implementation might be a `Set` of ValKeys, or it might be PostgreSQL. When you need them, just create a real class that implements `UsedLaunchCodes`.

## Conclusion

This article has explained the test double. Be aware of the different types of test doubles and choose an appropriate test double to write your tests.

[The code created in this article is up on GitHub](https://github.com/mahata/test-doubles-typescript-sample). However, it is recommended that you actually try your hand at it while reading the article, as simply looking at the final form will not help you understand it.
