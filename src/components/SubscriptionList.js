import React, { useState } from 'react';
import {
  Box, VStack, Heading, Table, Thead, Tbody, Tr, Th, Td, Button,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel,
  Input, Select
} from '@chakra-ui/react';

const SubscriptionList = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingSubscription, setEditingSubscription] = useState(null);

  const addSubscription = (newSubscription) => {
    setSubscriptions([...subscriptions, { ...newSubscription, id: Date.now() }]);
  };

  const editSubscription = (updatedSubscription) => {
    setSubscriptions(subscriptions.map(sub =>
      sub.id === updatedSubscription.id ? updatedSubscription : sub
    ));
  };

  const deleteSubscription = (id) => {
    setSubscriptions(subscriptions.filter(sub => sub.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const subscription = Object.fromEntries(formData.entries());

    if (editingSubscription) {
      editSubscription({ ...subscription, id: editingSubscription.id });
    } else {
      addSubscription(subscription);
    }

    onClose();
    setEditingSubscription(null);
  };

  const openEditModal = (subscription) => {
    setEditingSubscription(subscription);
    onOpen();
  };

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Heading>Your Subscriptions</Heading>
        <Button onClick={() => { setEditingSubscription(null); onOpen(); }}>
          Add Subscription
        </Button>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Category</Th>
              <Th>Cost</Th>
              <Th>Billing Cycle</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {subscriptions.map((sub) => (
              <Tr key={sub.id}>
                <Td>{sub.name}</Td>
                <Td>{sub.category}</Td>
                <Td>${sub.cost}</Td>
                <Td>{sub.billingCycle}</Td>
                <Td>
                  <Button size="sm" mr={2} onClick={() => openEditModal(sub)}>Edit</Button>
                  <Button size="sm" colorScheme="red" onClick={() => deleteSubscription(sub.id)}>Delete</Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>{editingSubscription ? 'Edit' : 'Add'} Subscription</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input name="name" defaultValue={editingSubscription?.name} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Category</FormLabel>
                  <Select name="category" defaultValue={editingSubscription?.category}>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Tools">Tools</option>
                    <option value="Utilities">Utilities</option>
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Cost</FormLabel>
                  <Input name="cost" type="number" step="0.01" defaultValue={editingSubscription?.cost} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Billing Cycle</FormLabel>
                  <Select name="billingCycle" defaultValue={editingSubscription?.billingCycle}>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </Select>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button type="submit" colorScheme="blue" mr={3}>
                {editingSubscription ? 'Save' : 'Add'}
              </Button>
              <Button onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SubscriptionList;