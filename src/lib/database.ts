import { supabase, Transaction } from './supabase'

export class DatabaseService {
  // ทดสอบการเชื่อมต่อ
  static async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('transactions')
        .select('count', { count: 'exact', head: true })

      if (error) {
        console.error('Connection test failed:', error)
        return false
      }

      console.log('Connection test successful, table exists')
      return true
    } catch (error) {
      console.error('Connection test error:', error)
      return false
    }
  }

  // โหลดข้อมูลทั้งหมด
  static async getTransactions(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching transactions:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getTransactions:', error)
      throw error
    }
  }

  // เพิ่มข้อมูลใหม่
  static async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    try {
      console.log('Creating transaction with data:', transaction) // Debug log
      
      const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select()
        .single()

      if (error) {
        console.error('Supabase error details:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        throw error
      }

      console.log('Transaction created successfully:', data)
      return data
    } catch (error) {
      console.error('Error in createTransaction:', error)
      throw error
    }
  }

  // แก้ไขข้อมูล
  static async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating transaction:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in updateTransaction:', error)
      throw error
    }
  }

  // ลบข้อมูล
  static async deleteTransaction(id: string): Promise<void> {
    try {
      console.log('Deleting transaction with ID:', id) // Debug log
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Supabase delete error details:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        throw error
      }
      
      console.log('Transaction deleted successfully from database') // Debug log
    } catch (error) {
      console.error('Error in deleteTransaction:', error)
      throw error
    }
  }

  // Real-time subscription
  static subscribeToTransactions(callback: (transactions: Transaction[]) => void) {
    const subscription = supabase
      .channel('transactions_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'transactions' 
        }, 
        async (payload) => {
          console.log('Real-time change detected:', payload) // Debug log
          // เมื่อมีการเปลี่ยนแปลง ให้โหลดข้อมูลใหม่
          try {
            const transactions = await this.getTransactions()
            callback(transactions)
            console.log('Data refreshed via real-time') // Debug log
          } catch (error) {
            console.error('Error refreshing data via real-time:', error)
          }
        }
      )
      .subscribe()

    return subscription
  }
}
