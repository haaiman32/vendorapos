import { db } from '../lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface NotificationPayload {
  to: string;
  subject: string;
  body: string;
  type: 'low_stock' | 'system' | 'support' | 'order';
}

class NotificationService {
  /**
   * Creates an in-app notification in Firestore
   */
  async createNotification(userId: string, title: string, message: string, type: NotificationPayload['type']) {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        message,
        type,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('[NotificationService] Error creating notification:', error);
    }
  }

  /**
   * Simulates sending an email notification.
   */
  async sendEmail(payload: NotificationPayload) {
    console.log(`[NotificationService] Sending email to ${payload.to}...`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Body: ${payload.body}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true, messageId: Math.random().toString(36).substring(7) };
  }

  /**
   * Checks if a vendor should be notified about low stock
   */
  async checkAndNotifyLowStock(vendorId: string, productName: string, currentStock: number) {
    try {
      const userDoc = await getDoc(doc(db, 'users', vendorId));
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();
      const prefs = userData.notifications || {};
      
      // Always create in-app notification if it's low stock
      await this.createNotification(
        vendorId,
        '⚠️ Low Stock Alert',
        `Your product "${productName}" is running low (${currentStock} left).`,
        'low_stock'
      );

      if (prefs.lowStock && prefs.emailAlerts) {
        await this.sendEmail({
          to: userData.email,
          subject: `⚠️ Low Stock Alert: ${productName}`,
          body: `Hello ${userData.displayName},\n\nYour product "${productName}" is running low on stock. Current level: ${currentStock}.\n\nPlease restock soon to avoid missing sales!`,
          type: 'low_stock'
        });
      }
    } catch (error) {
      console.error('[NotificationService] Error checking low stock:', error);
    }
  }

  async notifyNewOrder(supplierId: string, vendorName: string, orderId: string) {
    await this.createNotification(
      supplierId,
      '📦 New Order Received',
      `You have received a new supply order from ${vendorName} (ID: ${orderId.slice(0, 8)}).`,
      'order'
    );
  }

  async notifySupportReply(userId: string, subject: string) {
    await this.createNotification(
      userId,
      '💬 Support Reply',
      `Admin has replied to your ticket: "${subject}".`,
      'support'
    );
  }

  async notifyOrderStatusUpdate(vendorId: string, orderId: string, status: string, supplierName: string) {
    const statusText = status === 'shipped' ? 'has been shipped' : 
                      status === 'received' ? 'has been received' : 
                      status === 'cancelled' ? 'has been cancelled' : status;
    
    await this.createNotification(
      vendorId,
      '📦 Order Status Updated',
      `Your order from ${supplierName} (ID: ${orderId.slice(0, 8)}) ${statusText}.`,
      'order'
    );
  }
}

export const notificationService = new NotificationService();
