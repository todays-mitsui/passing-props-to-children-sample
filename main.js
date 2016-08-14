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
