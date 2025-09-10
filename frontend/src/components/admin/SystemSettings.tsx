import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { 
  Shield, 
  Bell, 
  Database, 
  Mail, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings,
  Server,
  Key,
  Download
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface SystemSettingsProps {
  onBack: () => void;
}

export function SystemSettings({ onBack }: SystemSettingsProps) {
  const [settings, setSettings] = useState({
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      webhookEnabled: true,
      overdueReminders: true,
      approvalReminders: true
    },
    security: {
      sessionTimeout: 480, // minutes
      requirePasswordChange: true,
      passwordChangeInterval: 90, // days
      maxLoginAttempts: 5,
      ipWhitelistEnabled: false
    },
    backup: {
      autoBackup: true,
      backupInterval: 'daily',
      retentionDays: 30,
      cloudBackup: true
    },
    integration: {
      apiEnabled: true,
      webhookUrl: 'https://api.grainpay.kz/webhook',
      apiKey: 'gp_*********************',
      bankIntegration: true
    }
  });

  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    toast.success('Настройка обновлена');
  };

  const handleSaveSettings = () => {
    // Here you would save settings to the backend
    toast.success('Настройки сохранены');
  };

  const handleBackup = () => {
    toast.success('Резервное копирование запущено');
  };

  const handleTestConnection = () => {
    toast.success('Соединение успешно');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="pl-0">
            ← Назад
          </Button>
          <div>
            <h2 className="text-2xl font-medium">Системные настройки</h2>
            <p className="text-muted-foreground">Конфигурация системы, безопасность и интеграции</p>
          </div>
        </div>
        <Button onClick={handleSaveSettings}>
          Сохранить изменения
        </Button>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Уведомления
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Безопасность
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Резервные копии
          </TabsTrigger>
          <TabsTrigger value="integration" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Интеграции
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Настройки уведомлений</CardTitle>
              <CardDescription>
                Управление системными уведомлениями и напоминаниями
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email уведомления</Label>
                  <p className="text-sm text-muted-foreground">
                    Отправка уведомлений по электронной почте
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.emailEnabled}
                  onCheckedChange={(checked) => 
                    handleSettingChange('notifications', 'emailEnabled', checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>SMS уведомления</Label>
                  <p className="text-sm text-muted-foreground">
                    Отправка SMS для критичных уведомлений
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.smsEnabled}
                  onCheckedChange={(checked) => 
                    handleSettingChange('notifications', 'smsEnabled', checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Webhook уведомления</Label>
                  <p className="text-sm text-muted-foreground">
                    Отправка уведомлений через webhook
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.webhookEnabled}
                  onCheckedChange={(checked) => 
                    handleSettingChange('notifications', 'webhookEnabled', checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Напоминания о просроченных заявках</Label>
                  <p className="text-sm text-muted-foreground">
                    Автоматические напоминания о заявках, превышающих SLA
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.overdueReminders}
                  onCheckedChange={(checked) => 
                    handleSettingChange('notifications', 'overdueReminders', checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Напоминания об утверждении</Label>
                  <p className="text-sm text-muted-foreground">
                    Напоминания распорядителям и казначеям о необходимости утверждения
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.approvalReminders}
                  onCheckedChange={(checked) => 
                    handleSettingChange('notifications', 'approvalReminders', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Настройки безопасности</CardTitle>
              <CardDescription>
                Управление безопасностью и аутентификацией пользователей
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Время сессии (минуты)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => 
                      handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Максимум попыток входа</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => 
                      handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Принудительная смена пароля</Label>
                  <p className="text-sm text-muted-foreground">
                    Требовать смену пароля каждые {settings.security.passwordChangeInterval} дней
                  </p>
                </div>
                <Switch
                  checked={settings.security.requirePasswordChange}
                  onCheckedChange={(checked) => 
                    handleSettingChange('security', 'requirePasswordChange', checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Белый список IP-адресов</Label>
                  <p className="text-sm text-muted-foreground">
                    Ограничить доступ только определенными IP-адресами
                  </p>
                </div>
                <Switch
                  checked={settings.security.ipWhitelistEnabled}
                  onCheckedChange={(checked) => 
                    handleSettingChange('security', 'ipWhitelistEnabled', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Резервное копирование</CardTitle>
              <CardDescription>
                Настройки автоматического резервного копирования данных
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Автоматическое резервное копирование</Label>
                  <p className="text-sm text-muted-foreground">
                    Регулярное создание резервных копий системы
                  </p>
                </div>
                <Switch
                  checked={settings.backup.autoBackup}
                  onCheckedChange={(checked) => 
                    handleSettingChange('backup', 'autoBackup', checked)
                  }
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Интервал резервного копирования</Label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={settings.backup.backupInterval}
                    onChange={(e) => 
                      handleSettingChange('backup', 'backupInterval', e.target.value)
                    }
                  >
                    <option value="hourly">Каждый час</option>
                    <option value="daily">Ежедневно</option>
                    <option value="weekly">Еженедельно</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Хранить копии (дней)</Label>
                  <Input
                    type="number"
                    value={settings.backup.retentionDays}
                    onChange={(e) => 
                      handleSettingChange('backup', 'retentionDays', parseInt(e.target.value))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Облачное резервное копирование</Label>
                  <p className="text-sm text-muted-foreground">
                    Сохранение копий в облачном хранилище
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.backup.cloudBackup}
                    onCheckedChange={(checked) => 
                      handleSettingChange('backup', 'cloudBackup', checked)
                    }
                  />
                  <Button variant="outline" size="sm" onClick={handleBackup}>
                    <Download className="h-4 w-4 mr-2" />
                    Создать копию
                  </Button>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Последняя резервная копия</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Создана: сегодня в 03:00 (размер: 145.6 МБ)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Внешние интеграции</CardTitle>
              <CardDescription>
                Настройки API и внешних интеграций системы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>API доступ</Label>
                  <p className="text-sm text-muted-foreground">
                    Разрешить внешним системам использовать API
                  </p>
                </div>
                <Switch
                  checked={settings.integration.apiEnabled}
                  onCheckedChange={(checked) => 
                    handleSettingChange('integration', 'apiEnabled', checked)
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  value={settings.integration.webhookUrl}
                  onChange={(e) => 
                    handleSettingChange('integration', 'webhookUrl', e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API ключ</Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type="password"
                    value={settings.integration.apiKey}
                    onChange={(e) => 
                      handleSettingChange('integration', 'apiKey', e.target.value)
                    }
                  />
                  <Button variant="outline" size="sm">
                    <Key className="h-4 w-4 mr-2" />
                    Создать новый
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Интеграция с банком</Label>
                  <p className="text-sm text-muted-foreground">
                    Автоматическая отправка реестров платежей в банк
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.integration.bankIntegration}
                    onCheckedChange={(checked) => 
                      handleSettingChange('integration', 'bankIntegration', checked)
                    }
                  />
                  <Button variant="outline" size="sm" onClick={handleTestConnection}>
                    Тест соединения
                  </Button>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Статус интеграций</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>API статус:</span>
                    <Badge className="bg-green-100 text-green-800">Активен</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Банковская интеграция:</span>
                    <Badge className="bg-green-100 text-green-800">Подключена</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Последняя синхронизация:</span>
                    <span className="text-muted-foreground">10 минут назад</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}