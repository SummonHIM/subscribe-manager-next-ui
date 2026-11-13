import { type Page, expect, test } from '@playwright/test'

/**
 * 进入已登录状态。
 *
 * 首次访问会经过 mock OIDC 自动登录，登录完成后渲染首页。
 */
async function login(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible({ timeout: 30000 })
}

/** 项目是否为移动端视口 */
function isMobileProject(projectName: string): boolean {
  return projectName.endsWith('-mobile')
}

/** 从首页进入第一个分组，返回分组 ID */
async function openFirstGroup(page: Page): Promise<string> {
  const link = page.locator('main a[href^="/group/?id="]').first()
  await expect(link).toBeVisible()

  const href = await link.getAttribute('href')
  const id = new URL(href!, 'http://127.0.0.1').searchParams.get('id')
  expect(id).toBeTruthy()

  await link.click()
  await page.waitForURL(/\/group\/\?id=\d+/)

  // 分组页在 Suspense 内加载，等标题出现后再返回
  await expect(page.locator('h1')).toBeVisible()

  return id!
}

/**
 * 断言页面没有横向溢出。
 *
 * 用 1px 容差吸收亚像素取整误差。
 */
async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
}

test.describe('登录与首页', () => {
  test('自动登录后展示导航、快捷入口与分组', async ({ page }) => {
    await login(page)

    await expect(page.getByText('订阅管理器')).toBeVisible()
    await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible()
    await expect(page.getByRole('button', { name: /下载客户端/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /融合订阅链接/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /订阅转换器/ })).toBeVisible()

    await expect(page.locator('main a[href^="/group/?id="]').first()).toBeVisible()
  })

  test('快捷入口卡片在桌面与手机下排布正确', async ({ page }, testInfo) => {
    await login(page)

    const first = page.getByRole('button', { name: /下载客户端/ })
    const second = page.getByRole('button', { name: /融合订阅链接/ })
    const third = page.getByRole('button', { name: /订阅转换器/ })

    const [a, b, c] = await Promise.all([
      first.boundingBox(),
      second.boundingBox(),
      third.boundingBox(),
    ])
    expect(a).not.toBeNull()
    expect(b).not.toBeNull()
    expect(c).not.toBeNull()

    if (isMobileProject(testInfo.project.name)) {
      // 手机：单列，三张卡片左对齐且逐张向下排列
      expect(Math.abs(a!.x - b!.x)).toBeLessThanOrEqual(1)
      expect(Math.abs(b!.x - c!.x)).toBeLessThanOrEqual(1)
      expect(b!.y).toBeGreaterThan(a!.y)
      expect(c!.y).toBeGreaterThan(b!.y)
    } else {
      // 桌面：三列，同一行
      expect(Math.abs(a!.y - b!.y)).toBeLessThanOrEqual(1)
      expect(Math.abs(b!.y - c!.y)).toBeLessThanOrEqual(1)
      expect(b!.x).toBeGreaterThan(a!.x)
      expect(c!.x).toBeGreaterThan(b!.x)
    }

    await expectNoHorizontalOverflow(page)
  })
})

test.describe('分组页', () => {
  test('展示订阅并在标签间切换', async ({ page }) => {
    await login(page)
    await openFirstGroup(page)

    const subscribeTab = page.getByRole('button', { name: /^订阅/ })
    const shareTab = page.getByRole('button', { name: /共享账号/ })

    await expect(subscribeTab).toBeVisible()
    await expect(shareTab).toBeVisible()

    // 默认在订阅标签
    await expect(subscribeTab).toHaveClass(/border-neutral-900|dark:border-neutral-100/)

    await shareTab.click()

    // 有共享账号则出现复制按钮，否则出现空状态
    const shareContent = page
      .getByRole('button', { name: '复制', exact: true })
      .or(page.getByText('暂无共享账号'))
    await expect(shareContent.first()).toBeVisible()

    await subscribeTab.click()
    const subscribeContent = page
      .getByRole('button', { name: '导入到…' })
      .or(page.getByText('暂无订阅内容'))
    await expect(subscribeContent.first()).toBeVisible()

    await expectNoHorizontalOverflow(page)
  })

  test('可打开二维码对话框并生成图片', async ({ page }) => {
    await login(page)
    await openFirstGroup(page)

    const importButton = page.getByRole('button', { name: '导入到…' }).first()
    if ((await importButton.count()) === 0) {
      test.skip(true, '当前分组没有订阅，跳过二维码用例')
      return
    }

    await importButton.click()
    await page.getByRole('menuitem', { name: '二维码', exact: true }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '二维码' })
    await expect(dialog).toBeVisible()

    const image = dialog.getByRole('img', { name: '订阅二维码' })
    await expect(image).toBeVisible()
    await expect(image).toHaveAttribute('src', /^data:image\//)
  })
})

test.describe('融合订阅', () => {
  test('输入令牌后生成融合链接', async ({ page }) => {
    await login(page)
    await page.goto('/converter')

    await expect(page.getByRole('heading', { name: '融合订阅' })).toBeVisible()

    await page.getByRole('button', { name: '添加令牌' }).click()
    await page.getByPlaceholder('粘贴 UUID 令牌').fill('11111111-1111-4111-8111-111111111111')

    const generated = page.locator('#converter-generated')
    await expect(generated).toHaveValue(/\/api\/subscribe\/\?token=/)
    await expect(generated).toHaveValue(/11111111-1111-4111-8111-111111111111/)

    await expectNoHorizontalOverflow(page)
  })
})

test.describe('管理员编辑页', () => {
  test('标签懒加载、搜索空状态与双击行内编辑', async ({ page }, testInfo) => {
    await login(page)
    const groupId = await openFirstGroup(page)

    await page.goto(`/group/editor/?id=${groupId}`)
    await expect(page.locator('h1')).toBeVisible()

    const settingsTab = page.getByRole('button', { name: '分组设置' })
    if ((await settingsTab.count()) === 0) {
      test.skip(true, '当前用户不是该分组管理员，跳编辑页用例')
      return
    }

    // 默认停留在分组设置
    await expect(page.getByText('分组信息')).toBeVisible()

    // 切到订阅标签
    await page.getByRole('button', { name: '订阅', exact: true }).click()
    await expect(page.getByText('分组订阅')).toBeVisible()

    const table = page.locator('.subscribe-table')
    const rows = table.locator('tbody tr')

    if ((await rows.count()) === 0) {
      test.skip(true, '当前分组没有订阅，跳行内编辑用例')
      return
    }

    if (isMobileProject(testInfo.project.name)) {
      // 手机上表头隐藏、行折叠成卡片
      await expect(table.locator('.p-datatable-thead')).toBeHidden()
    } else {
      await expect(table.locator('.p-datatable-thead')).toBeVisible()
    }

    // 搜索：无结果时显示空状态
    const search = page.getByPlaceholder('搜索名称或链接')
    await search.fill('zzzz-not-exist')
    await expect(page.getByText('没有匹配的结果')).toBeVisible()

    // 清空搜索恢复列表
    await search.fill('')
    await expect(rows.first()).toBeVisible()

    // 双击主单元格进入行内编辑
    const firstRow = rows.first()
    await firstRow.locator('td').nth(1).dblclick()

    const nameInput = firstRow.getByPlaceholder('订阅名称')
    await expect(nameInput).toBeVisible()

    // Esc 取消并还原
    await nameInput.press('Escape')
    await expect(nameInput).toBeHidden()

    await expectNoHorizontalOverflow(page)
  })
})
