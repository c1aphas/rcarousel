## Пример
Для кастомных стилей делаем отдельный файл:
`import sliderStyles from './slider.scss';`
Названия классов в этом scss-файле должны совпадать с оригинальными: `.root`, `.inner`, `.item`, `.pagination`, `.paginationItem`, `.paginationItemActive`, `.buttonPrev`, `.buttonNext`
```

<RCarousel
  classNames={sliderStyles}
  gap={20}
  pagination
  prevNext
>
  <article><p>test title</p></article>
  <article><p>test title 2</p></article>
  <article><p>test title 3</p></article>
</RCarousel>
```

## FAQ
В: Как сделать чтобы был только 1 слайд на экран?  
О: Это можно сделать стилями для `.item`:

```
.item {
  width: 100vw;
  display: flex;
  flex-shrink: 0;
  margin-left: 0 !important;
}
```

В: Как кастомизировать next\prev кнопки?  
О: Это можно сделать стилями для `.buttonNext`, `.buttonPrev`:

```
.buttonPrev {
  left: 16px;

  &:after {
    content: '\2039';
  }
}

.buttonNext {
  right: 16px;

  &:after {
    content: '\203A';
  }
}
```


## API
**gap** - отступ между слайдами _(default: 0)_  
**pagination** - пагинация _(default: false)_  
**prevNext** - кнопки "вперед/назад" _(default: false)_  
**stopPropagation** - запрет всплытия _(вложенные слайдеры, default: false)_  
**onSlideChange** - ф-ция обработчик на смену слайда _(default: emptyFunction)_  
**classNames** - набор стилей для кастомизации: _(default: объект со всеми ключами, значение которых '')_  
- `.root` - враппер
- `.inner` - контейнер для слайдов
- `.item` - элемент слайдера
- `.pagination` - контейнер пагинации
- `.paginationItem` - элемент пагинатора
- `.paginationItemActive` - активный элемент пагинатора
- `.buttonNext` - кнопка "следующий слайд"
- `.buttonPrev` - кнопка "предыдущий слайд"
