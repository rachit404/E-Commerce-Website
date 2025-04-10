# E-Commerce-Website

<details>
<summary><span style="font-size: 20px;"> Backend Setup </span></summary>
<br>

> **Open terminal for initialization**

```sh
cd backend

npm init

npm i express mongoose bcrypt cloudinary cookie-parser cors dotenv jsonwebtoken mongoose-aggregate-paginate-v2 multer

npm i -D nodemon

npm i -D prettier
```

> **Changes in package.json**

```js
"scripts": {
    "start": "nodemon ./src/index.js"
},
"type": "module",
```

> **Open terminal for gitkeep**

```sh
cd backend
mkdir public
cd public
mkdir temp
cd temp
touch .gitkeep
```

> **Open terminal**

```sh
cd  backend
touch .env .prettierrc .prettierignore
```

> **Prettier norm .prettierrc**
>
> > _Change this according to guidelines of team_

```js
{
  "singleQuote": false,
  "bracketSpacing": true,
  "tabWidth": 2,
  "semi": true,
  "trailingComma": "es5"
}
```

</details>

<details>
<summary><span style="font-size: 20px;"> Database and App Setup </span></summary>
<br>

1. **Start with db/index.js**
2. **Use connectDB in src/index.js**
3. **Create src/app.js**

</details>
