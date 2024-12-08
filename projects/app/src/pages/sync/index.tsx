import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useToast,
  Text,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Switch,
  Divider
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, RepeatIcon } from '@chakra-ui/icons';

interface WebsiteSync {
  id: string;
  url: string;
  lastSync: string;
  status: 'success' | 'failed' | 'syncing';
  autoSync: boolean;
  interval: number;
}

const WebsiteSyncPage = () => {
  const [websites, setWebsites] = useState<WebsiteSync[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [autoSync, setAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState(60);
  const toast = useToast();

  // 添加新网站
  const handleAddWebsite = () => {
    if (!newUrl) {
      toast({
        title: '请输入网站地址',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    const newWebsite: WebsiteSync = {
      id: Date.now().toString(),
      url: newUrl,
      lastSync: '-',
      status: 'success',
      autoSync,
      interval: syncInterval
    };

    setWebsites([...websites, newWebsite]);
    setNewUrl('');
    toast({
      title: '添加成功',
      status: 'success',
      duration: 2000
    });
  };

  // 删除网站
  const handleDeleteWebsite = (id: string) => {
    setWebsites(websites.filter((site) => site.id !== id));
    toast({
      title: '删除成功',
      status: 'success',
      duration: 2000
    });
  };

  // 手动同步
  const handleSync = (id: string) => {
    setWebsites(
      websites.map((site) => {
        if (site.id === id) {
          return {
            ...site,
            status: 'syncing',
            lastSync: new Date().toLocaleString()
          };
        }
        return site;
      })
    );

    // 模拟同步过程
    setTimeout(() => {
      setWebsites(
        websites.map((site) => {
          if (site.id === id) {
            return {
              ...site,
              status: 'success'
            };
          }
          return site;
        })
      );
      toast({
        title: '同步完成',
        status: 'success',
        duration: 2000
      });
    }, 2000);
  };

  const getStatusBadge = (status: WebsiteSync['status']) => {
    const statusMap = {
      success: { color: 'green', text: '同步成功' },
      failed: { color: 'red', text: '同步失败' },
      syncing: { color: 'blue', text: '同步中' }
    };
    const { color, text } = statusMap[status];
    return <Badge colorScheme={color}>{text}</Badge>;
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg" mb={6}>
          网站同步管理
        </Heading>

        {/* 添加新网站表单 */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md" mb={4}>
                添加新网站
              </Heading>
              <FormControl>
                <FormLabel>网站地址</FormLabel>
                <Input
                  placeholder="请输入网站URL"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </FormControl>

              <HStack justify="space-between">
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">自动同步</FormLabel>
                  <Switch isChecked={autoSync} onChange={(e) => setAutoSync(e.target.checked)} />
                </FormControl>

                {autoSync && (
                  <FormControl maxW="200px">
                    <FormLabel>同步间隔（分钟）</FormLabel>
                    <Input
                      type="number"
                      value={syncInterval}
                      onChange={(e) => setSyncInterval(Number(e.target.value))}
                      min={1}
                    />
                  </FormControl>
                )}
              </HStack>

              <Button colorScheme="blue" onClick={handleAddWebsite}>
                添加网站
              </Button>
            </VStack>
          </CardBody>
        </Card>

        <Divider />

        {/* 网站列表 */}
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>
              网站列表
            </Heading>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>网站地址</Th>
                  <Th>最后同步时间</Th>
                  <Th>状态</Th>
                  <Th>自动同步</Th>
                  <Th>同步间隔</Th>
                  <Th>操作</Th>
                </Tr>
              </Thead>
              <Tbody>
                {websites.map((site) => (
                  <Tr key={site.id}>
                    <Td>{site.url}</Td>
                    <Td>{site.lastSync}</Td>
                    <Td>{getStatusBadge(site.status)}</Td>
                    <Td>
                      <Badge colorScheme={site.autoSync ? 'green' : 'gray'}>
                        {site.autoSync ? '是' : '否'}
                      </Badge>
                    </Td>
                    <Td>{site.autoSync ? `${site.interval}分钟` : '-'}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="同步"
                          icon={<RepeatIcon />}
                          size="sm"
                          colorScheme="blue"
                          onClick={() => handleSync(site.id)}
                          isLoading={site.status === 'syncing'}
                        />
                        <IconButton
                          aria-label="编辑"
                          icon={<EditIcon />}
                          size="sm"
                          colorScheme="teal"
                        />
                        <IconButton
                          aria-label="删除"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDeleteWebsite(site.id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
                {websites.length === 0 && (
                  <Tr>
                    <Td colSpan={6}>
                      <Text textAlign="center" color="gray.500">
                        暂无数据
                      </Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default WebsiteSyncPage;
