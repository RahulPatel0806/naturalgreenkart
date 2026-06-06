/** Customer profile + address book management. */
import { userRepository } from '@/repositories/user.repository';
import { addressRepository } from '@/repositories/address.repository';
import { ForbiddenError, NotFoundError } from '@/core/errors/app-error';
import type { UpdateProfileInput, CreateAddressInput } from '@/validation/profile.schema';
import type { Address, RoleName } from '@prisma/client';

export interface ProfileDTO {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: RoleName;
  createdAt: string;
}

function toAddressDTO(a: Address) {
  return {
    id: a.id,
    type: a.type,
    fullName: a.fullName,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2,
    landmark: a.landmark,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    latitude: a.latitude,
    longitude: a.longitude,
    isDefault: a.isDefault,
  };
}

export const userService = {
  async getProfile(userId: string): Promise<ProfileDTO> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User');
    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      role: user.role.name,
      createdAt: user.createdAt.toISOString(),
    };
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<ProfileDTO> {
    const updated = await userRepository.update(userId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email || null } : {}),
    });
    return {
      id: updated.id,
      phone: updated.phone,
      name: updated.name,
      email: updated.email,
      role: updated.role.name,
      createdAt: updated.createdAt.toISOString(),
    };
  },

  // ── Addresses ────────────────────────────────────────────────────────
  async listAddresses(userId: string) {
    const addresses = await addressRepository.listForUser(userId);
    return addresses.map(toAddressDTO);
  },

  async createAddress(userId: string, input: CreateAddressInput) {
    const created = await addressRepository.create(userId, input);
    return toAddressDTO(created);
  },

  /** Ownership guard shared by update/delete/setDefault. */
  async assertOwnership(userId: string, addressId: string): Promise<Address> {
    const address = await addressRepository.findById(addressId);
    if (!address) throw new NotFoundError('Address');
    if (address.userId !== userId) throw new ForbiddenError('This address does not belong to you');
    return address;
  },

  async updateAddress(userId: string, addressId: string, input: Partial<CreateAddressInput>) {
    await this.assertOwnership(userId, addressId);
    const updated = await addressRepository.update(userId, addressId, input);
    return toAddressDTO(updated);
  },

  async deleteAddress(userId: string, addressId: string) {
    await this.assertOwnership(userId, addressId);
    await addressRepository.delete(addressId);
  },

  async setDefaultAddress(userId: string, addressId: string) {
    await this.assertOwnership(userId, addressId);
    const updated = await addressRepository.setDefault(userId, addressId);
    return toAddressDTO(updated);
  },
};
