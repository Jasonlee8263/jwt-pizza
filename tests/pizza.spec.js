import { test, expect } from "playwright-test-coverage";

test("home page", async ({ page }) => {
  await page.goto("/");

  expect(await page.title()).toBe("JWT Pizza");
});
test("purchase with login", async ({ page }) => {
  await page.route("*/**/api/order/menu", async (route) => {
    const menuRes = [
      {
        id: 1,
        title: "Veggie",
        image: "pizza1.png",
        price: 0.0038,
        description: "A garden of delight",
      },
      {
        id: 2,
        title: "Pepperoni",
        image: "pizza2.png",
        price: 0.0042,
        description: "Spicy treat",
      },
    ];
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: menuRes });
  });

  await page.route("*/**/api/franchise", async (route) => {
    const franchiseRes = [
      {
        id: 2,
        name: "LotaPizza",
        stores: [
          { id: 4, name: "Lehi" },
          { id: 5, name: "Springville" },
          { id: 6, name: "American Fork" },
        ],
      },
      { id: 3, name: "PizzaCorp", stores: [{ id: 7, name: "Spanish Fork" }] },
      { id: 4, name: "topSpot", stores: [] },
    ];
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: franchiseRes });
  });

  await page.route("*/**/api/auth", async (route) => {
    const loginReq = { email: "d@jwt.com", password: "a" };
    const loginRes = {
      user: {
        id: 3,
        name: "Kai Chen",
        email: "d@jwt.com",
        roles: [{ role: "diner" }],
      },
      token: "abcdef",
    };
    expect(route.request().method()).toBe("PUT");
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route("*/**/api/order", async (route) => {
    if(route.request().method()==="POST"){
      const orderReq = {
        items: [
          { menuId: 1, description: "Veggie", price: 0.0038 },
          { menuId: 2, description: "Pepperoni", price: 0.0042 },
        ],
        storeId: "4",
        franchiseId: 2,
      };
      const orderRes = {
        order: {
          items: [
            { menuId: 1, description: "Veggie", price: 0.0038 },
            { menuId: 2, description: "Pepperoni", price: 0.0042 },
          ],
          storeId: "4",
          franchiseId: 2,
          id: 23,
        },
        jwt: "eyJpYXQ",
      };
      expect(route.request().postDataJSON()).toMatchObject(orderReq);
      await route.fulfill({ json: orderRes });
    }
    else if(route.request().method()==="GET") {
      const orderRes = {
        dinerId: 4,
        orders: [
          {
            id: 1,
            franchiseId: 1,
            storeId: 1,
            date: "2024-06-05T05:14:40.000Z",
            items: [
              {
                id: 1,
                menuId: 1,
                description: "Veggie",
                price: 0.05
              }
            ]
          }
        ],
        page: 1
      }
      await route.fulfill({ json: orderRes });
    }
  });

  await page.goto("/");

  // Go to order page
  await page.getByRole("button", { name: "Order now" }).click();

  // Create order
  await expect(page.locator("h2")).toContainText("Awesome is a click away");
  await page.getByRole("combobox").selectOption("4");
  await page.getByRole("link", { name: "Image Description Veggie A" }).click();
  await page.getByRole("link", { name: "Image Description Pepperoni" }).click();
  await expect(page.locator("form")).toContainText("Selected pizzas: 2");
  await page.getByRole("button", { name: "Checkout" }).click();

  // Login
  await page.getByPlaceholder("Email address").click();
  await page.getByPlaceholder("Email address").fill("d@jwt.com");
  await page.getByPlaceholder("Email address").press("Tab");
  await page.getByPlaceholder("Password").fill("a");
  await page.getByRole("button", { name: "Login" }).click();

  // Pay
  await expect(page.getByRole("main")).toContainText(
    "Send me those 2 pizzas right now!"
  );
  await expect(page.locator("tbody")).toContainText("Veggie");
  await expect(page.locator("tbody")).toContainText("Pepperoni");
  await expect(page.locator("tfoot")).toContainText("0.008 ₿");
  await page.getByRole("button", { name: "Pay now" }).click();

  // Check balance
  await expect(page.getByText("0.008")).toBeVisible();
});
test("register", async ({ page }) => {
  await page.route("*/**/api/auth", async (route) => {
    const registerReq = { name: "test1", email: "test@jwt.com", password: "a" };
    const registerRes = {
      user: {
        id: 3,
        name: "test1",
        email: "test@jwt.com",
        roles: [{ role: "diner" }],
      },
      token: "abcdef",
    };
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toMatchObject(registerReq);
    await route.fulfill({ json: registerRes });
  });
  await page.goto("/");
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByPlaceholder("Full name").fill("test1");
  await page.getByPlaceholder("Full name").press("Tab");
  await page.getByPlaceholder("Email address").fill("test@jwt.com");
  await page.getByPlaceholder("Password").click();
  await page.getByPlaceholder("Password").fill("a");
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByRole("heading")).toContainText("The web's best pizza");
  await expect(page.locator("#navbar-dark")).toContainText("Logout");
  await page.getByRole("link", { name: "t", exact: true }).click();
  await expect(page.getByRole("heading")).toContainText("Your pizza kitchen");
  await expect(page.getByRole("main")).toContainText("test");
  // await expect(page.getByRole('main')).toContainText('Here is your history of all the good times.');
  // await page.getByRole('columnheader', { name: 'ID' }).click();
  // await expect(page.locator('thead')).toContainText('Price');
  // await expect(page.locator('thead')).toContainText('Date');
});
test("about", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("contentinfo")).toContainText("About");
  await page.getByRole("link", { name: "About" }).click();
  await expect(page.getByRole("main")).toContainText("The secret sauce");
  await expect(page.getByRole("main")).toContainText(
    "At JWT Pizza, our amazing employees are the secret behind our delicious pizzas. They are passionate about their craft and spend every waking moment dreaming about how to make our pizzas even better. From selecting the finest ingredients to perfecting the dough and sauce recipes, our employees go above and beyond to ensure the highest quality and taste in every bite. Their dedication and attention to detail make all the difference in creating a truly exceptional pizza experience for our customers. We take pride in our team and their commitment to delivering the best pizza in town."
  );
});

test("franchise", async ({ page }) => {
  await page.goto("/");
  await page
    .getByLabel("Global")
    .getByRole("link", { name: "Franchise" })
    .click();
  await expect(page.getByRole("main")).toContainText(
    "So you want a piece of the pie?"
  );
  await page.getByRole("main").locator("img").click();
});

test("logout", async ({ page }) => {
  await page.route("*/**/api/auth", async (route) => {
    if (route.request().method() === "PUT") {
      const loginReq = { email: "d@jwt.com", password: "a" };
    const loginRes = {
      user: {
        id: 3,
        name: "Kai Chen",
        email: "d@jwt.com",
        roles: [{ role: "diner" }],
      },
      token: "abcdef",
    };
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
    }
    else if(route.request().method() === "DELETE") {
      const logoutRes = {
        message: "logout successful",
      };
      expect(route.request().method()).toBe("DELETE");
      await route.fulfill({ json: logoutRes });
    }
  });
  await page.goto("/");
  //Login
  await page.getByText("Login").click();
  await page.getByPlaceholder("Email address").click();
  await page.getByPlaceholder("Email address").fill("d@jwt.com");
  await page.getByPlaceholder("Email address").press("Tab");
  await page.getByPlaceholder("Password").fill("a");
  await page.getByRole("button", { name: "Login" }).click();
  //Logout
  
  await page.getByRole("link", { name: "Logout" }).click();
});

test("history", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "History" }).click();
  await expect(page.getByRole("heading")).toContainText("Mama Rucci, my my");
  await page.getByRole("main").getByRole("img").click();
});

test("adminDashboard", async ({ page }) => {
  await page.route("*/**/api/auth", async (route) => {
    const loginReq = {
      email: "qdy460g53o@admin.com",
      password: "toomanysecrets",
    };
    const loginRes = {
      user: {
        id: 3,
        name: "Kai Chen",
        email: "qdy460g53o@admin.com",
        roles: [{ role: "admin" }],
      },
      token: "abcdef",
    };
    expect(route.request().method()).toBe("PUT");
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });
  await page.route("*/**/api/franchise", async (route) => {
    if (route.request().method() === "POST") {
      // POST 요청 처리
      const franchiseReq = {
        name: "test1234",
        admins: [{ email: "jxkkvjt5hm@admin.com" }],
      };
      const franchiseRes = {
        name: "pizzaPocket",
        admins: [
          {
            id: 4,
            name: "test1234",
            email: "jxkkvjt5hm@admin.com",
          },
        ],
        id: 1,
      };
      expect(route.request().postDataJSON()).toMatchObject(franchiseReq);
      await route.fulfill({ json: franchiseRes });
    } else if (route.request().method() === "GET") {
      // GET 요청 처리
      const franchiseRes = [
        {
          id: 1,
          name: "pizzaPocket",
          admins: [
            {
              id: 3,
              name: "pizza franchisee",
              email: "f@jwt.com",
            },
          ],
          stores: [
            {
              id: 10,
              name: "SLC",
              totalRevenue: 0.008,
            },
          ],
        },
      ];
      await route.fulfill({ json: franchiseRes });
    }
  });
  await page.goto("/");
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByPlaceholder("Email address").click();
  await page.getByPlaceholder("Email address").fill("qdy460g53o@admin.com");
  await page.getByPlaceholder("Password").click();
  await page.getByPlaceholder("Password").fill("toomanysecrets");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("link", { name: "Admin" }).click();
  await expect(page.getByRole("heading")).toContainText("Mama Ricci's kitchen");
  await page.getByRole("button", { name: "Add Franchise" }).click();
  await page.getByPlaceholder("franchise name").click();
  await page.getByPlaceholder("franchise name").fill("test1234");
  await page.getByPlaceholder("franchisee admin email").click();
  await page
    .getByPlaceholder("franchisee admin email")
    .fill("jxkkvjt5hm@admin.com");
  await page.getByPlaceholder("franchisee admin email").click();
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole('table')).toContainText('Close');
  await page.getByRole('row', { name: 'pizzaPocket pizza franchisee' }).getByRole('button').click();
  await expect(page.getByRole('heading')).toContainText('Sorry to see you go');
  await page.getByRole('button', { name: 'Close' }).click();
});

test("franchiseDashboard", async ({ page }) => {
  await page.goto("/");
  await page.route("*/**/api/auth", async (route) => {
    const loginReq = {
      email: "jxkkvjt5hm@admin.com",
      password: "toomanysecrets",
    };
    const loginRes = {
      user: {
        id: 3,
        name: "Kai Chen",
        email: "jxkkvjt5hm@admin.com",
        roles: [{ role: "franchisee" }],
      },
      token: "abcdef",
    };
    expect(route.request().method()).toBe("PUT");
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });
  // await page.route('*/**/api/franchise', async (route) => {
  //   // const franchiseRes = [
  //   //   {
  //   //     id: 2,
  //   //     name: 'LotaPizza',
  //   //     stores: [
  //   //       { id: 4, name: 'Lehi' },
  //   //       { id: 5, name: 'Springville' },
  //   //       { id: 6, name: 'American Fork' },
  //   //     ],
  //   //   },
  //   //   { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
  //   //   { id: 4, name: 'topSpot', stores: [] },
  //   // ];
  //   const franchiseRes = [
  //     {
  //       id: 1,
  //       name: 'pizzaPocket',
  //       admins: [
  //         {
  //           id: 3,
  //           name: 'pizza franchisee',
  //           email: 'f@jwt.com',
  //         },
  //       ],
  //       stores: [
  //         {
  //           id: 10,
  //           name: 'SLC',
  //           totalRevenue: 0.008,
  //         },
  //       ],
  //     },
  //   ];
  //   expect(route.request().method()).toBe('GET');
  //   await route.fulfill({ json: franchiseRes });
  // });
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByPlaceholder("Email address").fill("jxkkvjt5hm@admin.com");
  await page.getByPlaceholder("Password").click();
  await page.getByPlaceholder("Password").fill("toomanysecrets");
  await page.getByRole("button", { name: "Login" }).click();
  await page
    .getByLabel("Global")
    .getByRole("link", { name: "Franchise" })
    .click();
  // await page.getByRole('button', { name: 'Create store' }).click();
  // await page.getByPlaceholder('store name').click();
  // await page.getByPlaceholder('store name').fill('test');
  // await page.getByRole('button', { name: 'Create' }).click();
  // await page.getByRole('button', { name: 'Close' }).click();
  // await page.getByRole('button', { name: 'Close' }).click();
});

test("not found", async ({ page }) => {
  await page.route("*/**/api/auth", async (route) => {
    await route.fulfill({ json: null });
  });
  // await page.goto("http://localhost:5173/haha");
  await page.goto('http://localhost:5173/diner-dashboard');
  await expect(page.getByRole("heading")).toContainText("Oops");
});

test("docs", async ({ page }) => {
  await page.goto("http://localhost:5173/docs");
  await expect(page.getByRole("main")).toContainText("JWT Pizza API");
});

test("diner dashboard" ,async ({page})=> {
  await page.route("*/**/api/auth", async (route) => {
    const loginReq = { email: "d@jwt.com", password: "a" };
    const loginRes = {
      user: {
        id: 3,
        name: "Kai Chen",
        email: "d@jwt.com",
        roles: [{ role: "diner" }],
      },
      token: "abcdef",
    };
    expect(route.request().method()).toBe("PUT");
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route("*/**/api/order", async (route) => {
    if(route.request().method()==="POST"){
      const orderReq = {
        items: [
          { menuId: 1, description: "Veggie", price: 0.0038 },
          { menuId: 2, description: "Pepperoni", price: 0.0042 },
        ],
        storeId: "4",
        franchiseId: 2,
      };
      const orderRes = {
        order: {
          items: [
            { menuId: 1, description: "Veggie", price: 0.0038 },
            { menuId: 2, description: "Pepperoni", price: 0.0042 },
          ],
          storeId: "4",
          franchiseId: 2,
          id: 23,
        },
        jwt: "eyJpYXQ",
      };
      expect(route.request().postDataJSON()).toMatchObject(orderReq);
      await route.fulfill({ json: orderRes });
    }
    else if(route.request().method()==="GET") {
      const orderRes = {
        dinerId: 4,
        orders: [
          {
            id: 1,
            franchiseId: 1,
            storeId: 1,
            date: "2024-06-05T05:14:40.000Z",
            items: [
              {
                id: 1,
                menuId: 1,
                description: "Veggie",
                price: 0.05
              }
            ]
          }
        ],
        page: 1
      }
      await route.fulfill({ json: orderRes });
    }
  });
  // Login
  await page.goto('http://localhost:5173')
  await page.getByText("Login").click();
  await page.getByPlaceholder("Email address").click();
  await page.getByPlaceholder("Email address").fill("d@jwt.com");
  await page.getByPlaceholder("Email address").press("Tab");
  await page.getByPlaceholder("Password").fill("a");
  await page.getByRole("button", { name: "Login" }).click();
  await page.goto('http://localhost:5173/diner-dashboard');
  // await page.getByText('Here is your history of all').click();
  await expect(page.getByRole('main')).toContainText('Here is your history of all the good times.');
})

// test("should show NotFound if user is not present", async ({ page }) => {
//   // 로그인 요청을 가로채지 않아서 user가 null인 상태를 시뮬레이션
//   await page.route("*/**/api/auth", async (route) => {
//     await route.fulfill({ json: null });
//   });

//   await page.goto('http://localhost:5173/diner-dashboard');

//   // NotFound 컴포넌트가 렌더링되는지 확인
//   const notFoundText = await page.locator("text=Not Found").isVisible();
//   expect(notFoundText).toBeTruthy();
// });