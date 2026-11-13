import { type Ref, computed, ref } from 'vue'

import type { DataTableRowDoubleClickEvent } from 'primevue/datatable'

interface Identifiable {
  id: number
}

/**
 * 表格行内编辑
 * @param onSave 保存行数据
 */
export function useInlineEditor<T extends Identifiable>(onSave: (row: T) => Promise<void>) {
  // 正在编辑的行
  const editingRows: Ref<T[]> = ref([])

  // 进入编辑时的快照，取消时用于还原
  let snapshot: T | null = null

  /**
   * 该行是否正在编辑
   * @param row 行数据
   */
  const isEditing = (row: T) => editingRows.value.some((item) => item.id === row.id)

  /**
   * 开始编辑某一行
   * @param row 行数据
   */
  const startEdit = (row: T) => {
    // 切换编辑行时，先还原上一行未保存的修改
    const current = editingRows.value[0]
    if (current && current.id !== row.id && snapshot) {
      Object.assign(current, snapshot)
    }

    snapshot = { ...row }
    editingRows.value = [row]
  }

  /**
   * 保存行内编辑
   * @param row 正在编辑的行
   */
  const saveRow = async (row: T) => {
    await onSave(row)
    snapshot = null
    editingRows.value = editingRows.value.filter((item) => item.id !== row.id)
  }

  /**
   * 取消行内编辑并还原
   * @param row 正在编辑的行
   */
  const cancelRow = (row: T) => {
    if (snapshot) Object.assign(row, snapshot)
    snapshot = null
    editingRows.value = editingRows.value.filter((item) => item.id !== row.id)
  }

  /** 双击行进入编辑 */
  const onRowDblClick = (event: DataTableRowDoubleClickEvent) => {
    const target = event.originalEvent.target as HTMLElement | null
    if (target?.closest('input, button, textarea, select, a')) return

    if (!isEditing(event.data)) startEdit(event.data)
  }

  return {
    editingRows,
    isEditing,
    startEdit,
    saveRow,
    cancelRow,
    onRowDblClick,
    dirty: computed(() => editingRows.value.length > 0),
  }
}
