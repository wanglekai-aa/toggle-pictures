// 1. 对图片进行分类
// 2. 生成dom元素
// 3. 绑定事件
// 4. 显示到页面上

const methods = {
	appendChild(parent, ...children) {
		children.forEach(el => {
			parent.appendChild(el)
		})
	},
	$(selector, root = document) {
		return root.querySelector(selector)
	},
	$$(selector, root = document) {
		return root.querySelectorAll(selector)
	}
}

let canChange = true
let curPrevImgIndex = 0

class Img {
	constructor(options) {
		this._init(options)
		this._createElement()
		this._bind()
		this._show()
	}
	_init({ datas, defaultType, parasitifer }) {
		this.types = ['全部'] // 所有分类
		this.all = [] // 所有图片元素
		this.classified = { '全部': [] } // 分类后的图片
		this.curType = defaultType // 当前显示的分类
		this.parasitifer = methods.$(parasitifer) // 挂载点
		
		this.imgContainer = null // 所有图片容器
		this.wrap = null // 整体容器
		this.typeBtnsEls = null // 分类按钮组成的数组
		this.figures = null // 所有当前显示的图片组成的数组
		
		this._classify(datas)
		
		// console.log(this.classified)
	}
	// 根据分类获取图片
	_getImgsByType (type) {
		return type === '全部' ? [...this.all] : this.classified[type].map(index => this.all[index])
	}
	_diff (prevImgs, nextImgs) {
		
		const diffArr = []
		
		prevImgs.forEach((src1, idx1) => {
			let idx2 = nextImgs.findIndex(src2 => src2 === src1)
			if (idx2 !== -1) {
				diffArr.push([idx1, idx2])
			}
		})
		
		return diffArr
	}
	_classify (datas) {
		const srcs = []
		
		datas.forEach(({ type, src, alt, title }) => {
			// 是否已经存在 分类
			if (!this.types.includes(type)) {
				this.types.push(type)
			}
			
			// 分类是否 存在 分类后的数据中
			if (!Object.keys(this.classified).includes(type)) {
				this.classified[type] = []
			}
			
			if (!srcs.includes(src)) {
				// 图片未生成，需要生成图片
				// 并添加到 对应分类中
				srcs.push(src)
				
				const figure = document.createElement('figure')
				const img = document.createElement('img')
				const figcaption = document.createElement('figcaption')
				
				img.src = src
				img.setAttribute('alt', alt)
				figcaption.innerText = title
				methods.appendChild(figure, img, figcaption)
				
				this.all.push(figure)
				this.classified[type].push(this.all.length - 1)
			} else {
				// 去 all 中找到对应的图片
				// 添加到对应到分类中
				let index = srcs.findIndex(s1 => s1 === src)
				this.classified[type].push(index)
			}
		})
	}
	// 生成 DOM 
	_createElement() {
		// 创建分类按钮
		const typeBtns = []
		
		for (let type of this.types.values()) {
			typeBtns.push(`<li class="__Img__classify__type-btn ${ type === this.curType ? '__Img__type-btn-active' : '' }">${type}</li>`)
		}
		// console.log(typeBtns);
		// 整体模版
		let template = `
			<ul class="__Img__classify">
				${ typeBtns.join('') }
			</ul>
			<div class="__Img__img-container"></div>
		`
		const wrap = document.createElement('div')
		wrap.className = '__Img__container'
		wrap.innerHTML = template
		
		this.imgContainer = methods.$('.__Img__img-container', wrap)
		
		methods.appendChild(this.imgContainer, ...this._getImgsByType(this.curType))
		
		this.wrap = wrap
		this.typeBtnsEls = [...methods.$$('.__Img__classify__type-btn', wrap)]
		this.figures = [...methods.$$('figure', wrap)]
		
		// 遮罩层
		const overlay = document.createElement('div')
		overlay.className = '__Img__overlay'
		overlay.innerHTML = `
			<div class="__Img__overlay-prev-btn"></div>
			<div class="__Img__overlay-next-btn"></div>
			<img src="" alt="">
		`
		methods.appendChild(this.wrap, overlay)
		this.overlay = overlay
		this.previewImg = methods.$('img', overlay)

		this._calcPosition(this.figures)
	}
	// 绑定事件
	_bind() {
		// 分类切换 事件
		methods.$('.__Img__classify', this.wrap).addEventListener('click' ,({target}) => {
			if (target.nodeName !== 'LI') return
			if (!canChange) return
			canChange = false
			
			const type = target.innerText
			if (type === this.curType) return
			this.curType = type
			const els = this._getImgsByType(type)
			
			const prevImgs = this.figures.map(figure => (
				methods.$('img', figure).src
			))
			const nextImgs = els.map(figure => (
				methods.$('img', figure).src
			))
			
			// console.log('prevImgs: ', prevImgs);
			// console.log('nextImgs: ', nextImgs);
			const diffArr = this._diff(prevImgs, nextImgs)

			diffArr.forEach(([, i2]) => {
				this.figures.every((figure, index) => {
					let src = methods.$('img', figure).src
					
					if (src === nextImgs[i2]) {
						this.figures.splice(index, 1)
						return false
					}
					return true
				})
			})
			this._calcPosition(els)
			
			let needAppendEls = []
			if (diffArr.length) {
				let nextElsIndex = diffArr.map(([, i2]) => i2)
				
				els.forEach((figure, index) => {
					if (!nextElsIndex.includes(index)) {
						needAppendEls.push(figure)
					}
				})
			} else {
				needAppendEls = els
			}
			
			this.figures.forEach(el => {
				el.style.transform = 'scale(0, 0) translate(0, 100%)'
				el.style.opacity = '0'
			})
			methods.appendChild(this.imgContainer, ...needAppendEls)
			
			setTimeout(() => {
				els.forEach(el => {
					el.style.transform = 'scale(1, 1) translate(0, 0)'
					el.style.opacity = '1'
				})
			})
			setTimeout(() => {
				this.figures.forEach(figure => {
					this.imgContainer.removeChild(figure)
				})
				this.figures = els
				canChange = true
			}, 600)
			
			this.typeBtnsEls.forEach(btn => (btn.className = '__Img__classify__type-btn'))
			target.className = '__Img__classify__type-btn __Img__type-btn-active'
		})
		
		// 图片预览事件
		this.imgContainer.addEventListener('click', ({target}) => {
			let nodeName = target.nodeName
			if (nodeName !== 'FIGURE' && nodeName !== 'FIGCAPTION') return
			if (nodeName === 'FIGCAPTION') target = target.parentNode
			
			const src = methods.$('img', target).src
			curPrevImgIndex = this.figures.findIndex(figure => {
				return src === methods.$('img', figure).src
			})
			this.previewImg.src = src
			this.overlay.style.display = 'flex'
			setTimeout(() => {
				this.overlay.style.opacity = '1'
			})
		})
		// 遮罩层关闭事件
		this.overlay.addEventListener('click', () => {
			this.overlay.style.opacity = '0'
			setTimeout(() => {
				this.overlay.style.display = 'none'
			}, 300)
		})
		
		// 上一张图片切换事件
		methods.$('.__Img__overlay-prev-btn', this.overlay).addEventListener('click', e => {
			e.stopPropagation()
			curPrevImgIndex = curPrevImgIndex === 0 ? this.figures.length - 1 : curPrevImgIndex - 1
			methods.$('img', this.overlay).src = methods.$('img', this.figures[curPrevImgIndex]).src
		})
		// 下一张图片切换事件
		methods.$('.__Img__overlay-next-btn', this.overlay).addEventListener('click', e => {
			e.stopPropagation()
			curPrevImgIndex = curPrevImgIndex === this.figures.length - 1 ? 0 : curPrevImgIndex + 1
			methods.$('img', this.overlay).src = methods.$('img', this.figures[curPrevImgIndex]).src
		})
	}
	// 显示元素
	_show() {
		methods.appendChild(this.parasitifer, this.wrap)
		
		setTimeout(() => {
			this.figures.forEach(figure => {
				figure.style.transform = 'scale(1, 1) translate(0, 0)'
				figure.style.opacity = '1'
			})
		})
	}
	_calcPosition (figures) {
		let horizontalImgIndex = 0
		
		figures.forEach((figure, index) => {
			figure.style.top = parseInt(index / 4) * 154 + parseInt(index / 4) * 15 + 'px'
			figure.style.left = horizontalImgIndex * 240 + horizontalImgIndex * 15 + 'px'
			figure.style.transform = 'scale(0, 0) translate(0, -100%)'
			horizontalImgIndex = (horizontalImgIndex + 1) % 4 
		})
		let len = Math.ceil(figures.length / 4)
		this.imgContainer.style.height = len * 154 + (len - 1) * 15 + 'px'
	}
}

export default Img;
