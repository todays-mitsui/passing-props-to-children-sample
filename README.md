# passing-props-to-children-sample

このリポジトリは下記の記事のデモとして作成されたものです。

- [React で this.props.children に新しい Props を渡す](http://blog.mudatobunka.org/entry/2016/08/14/182333)

## React で this.props.children に新しい Props を渡す

React でカスタムコンポーネントを作るとき、コンポーネントの子要素には `this.props.children` でアクセスできます。  
この `this.props.children` はそのままレンダリングすることもできるのですが、何かしらの Props を渡したくなったらどうするのでしょうか。

ざっくり調べた感じ Stack Overflow とか海外のブログにしか情報が無いようだったのでまとめてみます。

<br>

### TL;DR

いきなり結論から、  
`this.props.children` に直接 Props を渡すことはできません。  
代わりの方法として、`React.cloneElement()` で React要素をクローンする時に Props を渡すことができるので、`this.props.children` をクローンしつつ Props を渡せばいいようです。

デモを用意しました。

- [デモ](https://todays-mitsui.github.io/passing-props-to-children-sample/)
- [ソース](https://github.com/todays-mitsui/passing-props-to-children-sample/blob/master/main.js)
- [リポジトリ](https://github.com/todays-mitsui/passing-props-to-children-sample)

<br>

以下のようにすればローカルでデモをいじりつつ試せます。

```bash
$ git clone https://github.com/todays-mitsui/passing-props-to-children-sample.git
$ cd passing-props-to-children-sample
$ npm install
$ npm start
```

<br>

### 要素に Props を渡す

`this.props.children` に限らず React要素は `React.cloneElement()` という API でクローンできます。  
そのとき第2引数にオブジェクトを渡すと、React要素が持っている既存の Props とマージされた後、新しい Props として設定されるとのことです。

```javascript
let elementWithProps = React.cloneElement(element, { foo: 'bar' })
```

公式ドキュメントに解説があるので、詳しくはそちらをどうぞ。

- [React.cloneElement - Top-Level API](https://facebook.github.io/react/docs/top-level-api-ja-JP.html#react.cloneelement)

<br>

### `this.props.children` に応じた処理をする

ところで `this.props.children` で参照できるオブジェクトは常に同じものとは限りません。  
複数の子要素を持っている場合には `this.props.children` は **React要素の配列** になります。  
その他、子要素がただのテキストノードだった場合には **string** に、子要素を持たない場合は **undefined** と、まぁ場合によっていろいろみたいです。

そんな `this.props.children` を上手く扱うために `React.Children` というユーティリティクラスが用意されています。  
使うときには `React.Children` で参照するほかに、ES2015 で記述しているなら、

```javascript
import { Children } from 'react'
```

というように個別にインポートしてもいいでしょう。

<br>

今回は `React.Children.map()` を使って子要素一つひとつに Props を渡します。

```javascript
const newProps = { foo: 'bar' }

const childrenWithProps = React.Children.map(
  this.props.children,
  (child) => {
    // 各子要素をクローンしつつ newProps を渡す
    return React.cloneElement(child, newProps)
  }
)
```

さて、実はこれだけではいけません。  
子要素がテキストノードを含んでいる場合には、上記の `child` に string が渡されます。そして `React.cloneElement()` は string を受け取ってくれないので、そこでエラーが発生します。

なので `child` の type を判別しつ上手いこと処理を分岐しましょう。  
string が渡ってきた場合には何もせず、そのまま返すようにします。

```javascript
const newProps = { foo: 'bar' }

const childrenWithProps = React.Children.map(
  this.props.children,
  (child) => {
    console.info(typeof child, child)

    switch (typeof child) {
      case 'string':
        // 子要素がテスキスとノードだった場合はそのまま return
        return child

      case 'object':
        // React要素だった場合は newProps を渡す
        return React.cloneElement(child, newProps)

      default:
        // それ以外の場合はとりあえず null 返しとく
        return null
    }
  }
)
```

これで `this.props.children` を複製しつつ Props を渡した `childrenWithProps` を作ることができました。

<br>

`React.Children.map()` についても公式ドキュメントの解説が親切でした。

- [React.Children.map - Top-Level API](https://facebook.github.io/react/docs/top-level-api-ja-JP.html#react.children.map)

<br>

### 簡単なデモ

やり方の説明としては以上なんですが、上記のコードは単体では動かないので実際に動作する簡単なデモを書きました。

- [デモ](https://todays-mitsui.github.io/passing-props-to-children-sample/)

ロジック部分は1ファイルでこのようになっています。

```javascript
/* main.js */

import React, { Children } from 'react'
import ReactDom from 'react-dom'


class Child extends React.Component {
  render() {
    const parentName = this.props.parentName || 'UnknownParent'
    const name = this.props.name || 'UnknownChild'

    return (
      <p>
        ParentName: <em>{parentName}</em> > ChildName: <em>{name}</em>
      </p>
    )
  }
}

class Parent extends React.Component {
  render() {
    const newProps = { parentName: 'foo' }

    const childrenWithProps = Children.map(
      this.props.children,
      (child) => {
        console.info(typeof child, child)

        switch (typeof child) {
          case 'string':
            return child

          case 'object':
            return React.cloneElement(child, newProps)

          default:
            return null
        }
      }
    )

    return (
      <div>
        {childrenWithProps}
      </div>
    )
  }
}


ReactDom.render(
  (
    <Parent>
      ### Text Node ###
      <Child name='hoge' />
      <Child name='fuga' />
      <Child name='piyo' />
    </Parent>
  ),
  document.querySelector('.container')
)
```

`<Child>` コンポーネントは `name`, `parentName` という2つの Props を `<p>` タグの中で表示するだけの簡単なものです。  
今回は `parentName` の方を親要素の `<Parent>` コンポーネントから渡してあげています。

<br>

今回のデモのソースは全て GitHub に置いてあります。

- [todays-mitsui/passing-props-to-children-sample](https://github.com/todays-mitsui/passing-props-to-children-sample)

<br>

### まとめ

React はもともと API が少なくて学習コストが少ないと思っているんですが、少ないなりに覚えておくと便利な API もありますね。  
`React.cloneElement()` は `this.props.children` をカスタマイズする以外にもいろいろな用途で使えるはずです。

<br>

私からは以上です。
